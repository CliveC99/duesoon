import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedTimetableUrl = { ciphertext: Buffer; iv: Buffer; authTag: Buffer };

function encryptionKey(value = process.env.TIMETABLE_ENCRYPTION_KEY) {
  if (!value) throw new Error("TIMETABLE_ENCRYPTION_KEY is not configured.");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64").replace(/=+$/, "") !== value.trim().replace(/=+$/, "")) {
    throw new Error("TIMETABLE_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
  return key;
}

function additionalData(userId: string) {
  return Buffer.from(`duesoon:timetable-feed:v1:${userId}`, "utf8");
}

export function encryptTimetableUrl(url: string, userId: string, keyValue?: string): EncryptedTimetableUrl {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(keyValue), iv);
  cipher.setAAD(additionalData(userId));
  const ciphertext = Buffer.concat([cipher.update(url, "utf8"), cipher.final()]);
  return { ciphertext, iv, authTag: cipher.getAuthTag() };
}

export function decryptTimetableUrl(encrypted: EncryptedTimetableUrl, userId: string, keyValue?: string) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(keyValue), encrypted.iv);
  decipher.setAAD(additionalData(userId));
  decipher.setAuthTag(encrypted.authTag);
  return Buffer.concat([decipher.update(encrypted.ciphertext), decipher.final()]).toString("utf8");
}
