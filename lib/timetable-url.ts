import { BlockList, isIP } from "node:net";

const blockedIpv4 = new BlockList();
const blockedIpv6 = new BlockList();

for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blockedIpv4.addSubnet(network, prefix, "ipv4");

for (const [network, prefix] of [
  ["::", 128], ["::1", 128], ["::ffff:0:0", 96], ["64:ff9b::", 96], ["100::", 64],
  ["2001::", 23], ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) blockedIpv6.addSubnet(network, prefix, "ipv6");

const internalNames = new Set(["localhost", "localhost.localdomain", "ip6-localhost", "metadata", "metadata.google.internal"]);

export class TimetableUrlError extends Error {
  readonly safeMessage: string;
  readonly code: TimetableFailureCode;

  constructor(code: TimetableFailureCode, safeMessage: string) {
    super(safeMessage);
    this.code = code;
    this.safeMessage = safeMessage;
    this.name = "TimetableUrlError";
  }
}

export type TimetableFailureCode =
  | "URL_INVALID"
  | "URL_CREDENTIALS"
  | "URL_PROTOCOL"
  | "URL_PORT"
  | "URL_PRIVATE_HOST"
  | "DNS_LOOKUP_FAILED"
  | "SSRF_ADDRESS_REJECTED"
  | "TLS_ERROR"
  | "REDIRECT_INVALID"
  | "REDIRECT_LIMIT"
  | "HTTP_STATUS"
  | "TIMEOUT"
  | "RESPONSE_TOO_LARGE"
  | "CONTENT_TYPE_INVALID"
  | "NETWORK_ERROR"
  | "PARSER_FAILURE"
  | "ENCRYPTION_FAILURE";

export function normaliseTimetableUrl(value: string, production = process.env.NODE_ENV === "production") {
  const trimmed = value.trim();
  let candidate = trimmed;
  if (/^webcal:/i.test(candidate)) candidate = `https:${candidate.slice(candidate.indexOf(":" ) + 1)}`;

  let url: URL;
  try { url = new URL(candidate); } catch { throw new TimetableUrlError("URL_INVALID", "Feed URL is invalid"); }
  if (url.username || url.password) throw new TimetableUrlError("URL_CREDENTIALS", "Feed URL must not contain embedded credentials");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && !production)) throw new TimetableUrlError("URL_PROTOCOL", production ? "Timetable feed must use HTTPS" : "Feed URL must use HTTP or HTTPS");
  if (!url.hostname || url.port && !/^\d+$/.test(url.port)) throw new TimetableUrlError("URL_INVALID", "Feed URL is invalid");
  if (url.port && !((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80"))) throw new TimetableUrlError("URL_PORT", "Timetable feed uses an unsupported port");
  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (internalNames.has(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) throw new TimetableUrlError("URL_PRIVATE_HOST", "Feed URL cannot point to a private network");
  if (isIP(hostname) && !isPublicAddress(hostname)) throw new TimetableUrlError("URL_PRIVATE_HOST", "Feed URL cannot point to a private network");
  url.hash = "";
  return url;
}

export function isPublicAddress(address: string) {
  const family = isIP(address);
  if (!family) return false;
  return family === 4 ? !blockedIpv4.check(address, "ipv4") : !blockedIpv6.check(address, "ipv6");
}

export function validateResolvedAddresses(addresses: readonly { address: string; family: number }[]) {
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new TimetableUrlError("SSRF_ADDRESS_REJECTED", "Feed URL cannot point to a private network");
  return addresses;
}
