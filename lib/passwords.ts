import { compare, hash } from "bcryptjs";

export const BCRYPT_COST = 12;

export function hashPassword(password: string) {
  return hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}
