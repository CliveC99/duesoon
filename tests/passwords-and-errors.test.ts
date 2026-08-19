import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma } from "@prisma/client";

import { BCRYPT_COST, hashPassword, verifyPassword } from "../lib/passwords.ts";
import { isUniqueConstraintError } from "../lib/prisma-errors.ts";

test("passwords use the configured bcrypt cost and verify correctly", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(Number(hash.split("$")[2]), BCRYPT_COST);
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  assert.equal(await verifyPassword("wrong password", hash), false);
});

test("duplicate email races are identified by Prisma P2002 only", () => {
  const duplicate = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "6.12.0" });
  const other = new Prisma.PrismaClientKnownRequestError("Record missing", { code: "P2025", clientVersion: "6.12.0" });
  assert.equal(isUniqueConstraintError(duplicate), true);
  assert.equal(isUniqueConstraintError(other), false);
  assert.equal(isUniqueConstraintError(new Error("P2002")), false);
});
