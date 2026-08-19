import "server-only";

import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import tls from "node:tls";

import { normaliseTimetableUrl, TimetableUrlError, type TimetableFailureCode, validateResolvedAddresses } from "@/lib/timetable-url";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const modernTls = tls as typeof tls & { getCACertificates(type: "default" | "system"): string[] };
const trustedCertificateAuthorities = [...new Set([...modernTls.getCACertificates("default"), ...modernTls.getCACertificates("system")])];

export class TimetableFetchError extends Error {
  readonly safeMessage: string;
  readonly code: TimetableFailureCode;
  readonly detail?: string;

  constructor(code: TimetableFailureCode, safeMessage: string, detail?: string) {
    super(safeMessage);
    this.code = code;
    this.detail = detail;
    this.safeMessage = safeMessage;
    this.name = "TimetableFetchError";
  }
}

const tlsErrorCodes = new Set(["CERT_HAS_EXPIRED", "CERT_NOT_YET_VALID", "DEPTH_ZERO_SELF_SIGNED_CERT", "SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_GET_ISSUER_CERT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "ERR_TLS_CERT_ALTNAME_INVALID"]);

export function classifyRequestError(error: unknown): TimetableFetchError {
  if (error instanceof TimetableFetchError) return error;
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "UNKNOWN";
  if (tlsErrorCodes.has(code) || code.startsWith("ERR_TLS_")) return new TimetableFetchError("TLS_ERROR", "Could not establish a secure connection to the timetable feed", code);
  return new TimetableFetchError("NETWORK_ERROR", "Could not reach timetable feed", code);
}

async function requestOnce(url: URL): Promise<{ status: number; location?: string; body: string; contentType?: string }> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  let resolved;
  try { resolved = await lookup(hostname, { all: true, verbatim: true }); } catch (error) {
    const detail = typeof error === "object" && error && "code" in error ? String(error.code) : "UNKNOWN";
    throw new TimetableFetchError("DNS_LOOKUP_FAILED", "Could not resolve timetable feed", detail);
  }
  const addresses = validateResolvedAddresses(resolved);
  const chosen = addresses[0];
  const transport = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      method: "GET",
      headers: { Accept: "text/calendar, application/ics;q=0.9, text/plain;q=0.5", "User-Agent": "DueSoon-Timetable/1.0" },
      timeout: TIMEOUT_MS,
      ...(url.protocol === "https:" ? { ca: trustedCertificateAuthorities } : {}),
      lookup: (_hostname, options, callback) => {
        if (typeof options === "object" && options.all) callback(null, [chosen]);
        else callback(null, chosen.address, chosen.family);
      },
    }, (response) => {
      const status = response.statusCode ?? 0;
      const location = response.headers.location;
      if (status >= 300 && status < 400) { response.resume(); resolve({ status, location, body: "" }); return; }
      if (status < 200 || status >= 300) { response.resume(); reject(new TimetableFetchError("HTTP_STATUS", "Timetable feed returned an error", String(status))); return; }
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_BYTES) request.destroy(new TimetableFetchError("RESPONSE_TOO_LARGE", "Timetable feed is too large"));
        else chunks.push(chunk);
      });
      response.on("end", () => resolve({ status, body: Buffer.concat(chunks).toString("utf8"), contentType: response.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase() }));
    });
    request.on("timeout", () => request.destroy(new TimetableFetchError("TIMEOUT", "Timetable feed took too long to respond")));
    request.on("error", (error) => reject(classifyRequestError(error)));
    request.end();
  });
}

export async function fetchTimetableFeed(rawUrl: string) {
  let current = normaliseTimetableUrl(rawUrl);
  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      const response = await requestOnce(current);
      if (response.status < 300 || response.status >= 400) return { body: response.body, contentType: response.contentType };
      if (!response.location) throw new TimetableFetchError("REDIRECT_INVALID", "Timetable feed returned an invalid redirect");
      if (redirects === MAX_REDIRECTS) throw new TimetableFetchError("REDIRECT_LIMIT", "Timetable feed redirected too many times");
      try { current = normaliseTimetableUrl(new URL(response.location, current).toString()); } catch (error) {
        if (error instanceof TimetableUrlError) throw new TimetableFetchError("REDIRECT_INVALID", "Timetable feed redirected to an unsafe address", error.code);
        throw new TimetableFetchError("REDIRECT_INVALID", "Timetable feed returned an invalid redirect");
      }
    }
  } catch (error) {
    if (error instanceof TimetableFetchError || error instanceof TimetableUrlError) throw error;
    throw classifyRequestError(error);
  }
  throw new TimetableFetchError("NETWORK_ERROR", "Could not reach timetable feed");
}
