import test from "node:test";
import assert from "node:assert/strict";
import { safeUser } from "../src/services/auth.service.js";
import { generateToken } from "../src/utils/generateToken.js";

test("safeUser never serializes the password hash", () => {
  const user = safeUser({
    id: "u1",
    email: "student@example.edu",
    password: "$2a$12$hash",
    role: "STUDENT",
  });
  assert.equal(user.password, undefined);
  assert.equal(JSON.stringify(user).includes("$2a$12$hash"), false);
});

test("token signing requires a configured secret", () => {
  const previous = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  assert.throws(
    () => generateToken({ id: "u1", role: "STUDENT" }),
    /JWT_SECRET/,
  );
  if (previous !== undefined) process.env.JWT_SECRET = previous;
});
