import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedOpportunityTransition,
  isFutureDate,
  parseIsoDate,
  parsePagination,
  publicOpportunityStatus,
  validateHttpUrl,
} from "../src/utils/industry.validation.js";
import { errorHandler } from "../src/middleware/error.middleware.js";

test("pagination uses defaults and rejects invalid or excessive values", () => {
  assert.deepEqual(parsePagination({}), { page: 1, pageSize: 20 });
  assert.deepEqual(parsePagination({ page: "10000", pageSize: "100" }), { page: 10000, pageSize: 100 });
  for (const page of ["0", "-1", "1.5", "1e4", "9007199254740992", "10001"]) {
    assert.ok(parsePagination({ page }).error, `expected page ${page} to be rejected`);
  }
  for (const pageSize of ["0", "-1", "1.5", "101"]) {
    assert.ok(parsePagination({ pageSize }).error, `expected pageSize ${pageSize} to be rejected`);
  }
});

test("date parser requires a real calendar date and explicit ISO timezone", () => {
  assert.ok(parseIsoDate("2028-02-29T10:30:00Z"));
  assert.equal(parseIsoDate("2027-02-29T10:30:00Z"), null);
  assert.equal(parseIsoDate("2026-04-31T10:30:00Z"), null);
  assert.equal(parseIsoDate("2026-12-01T10:30:00"), null);
  assert.equal(parseIsoDate("2026-12-01T25:30:00Z"), null);
  assert.equal(parseIsoDate("2026-12-01T10:30:00+25:00"), null);
  assert.equal(parseIsoDate(1_800_000_000_000), null);
});

test("application deadline helper distinguishes past and future dates", () => {
  const now = new Date("2026-11-10T10:00:00Z");
  assert.equal(isFutureDate(new Date("2026-11-10T10:00:01Z"), now), true);
  assert.equal(isFutureDate(new Date("2026-11-10T09:59:59Z"), now), false);
  assert.equal(isFutureDate(new Date("invalid"), now), false);
});

test("HTTP URL validation accepts only absolute HTTP(S) URLs without credentials", () => {
  assert.equal(validateHttpUrl("https://example.com/path"), true);
  assert.equal(validateHttpUrl("http://localhost:3000"), true);
  assert.equal(validateHttpUrl("javascript:alert(1)"), false);
  assert.equal(validateHttpUrl("example.com"), false);
  assert.equal(validateHttpUrl("https://user:pass@example.com"), false);
});

test("public browse permits only open opportunities", () => {
  assert.deepEqual(publicOpportunityStatus(undefined), { status: "OPEN" });
  assert.deepEqual(publicOpportunityStatus("OPEN"), { status: "OPEN" });
  for (const status of ["DRAFT", "CLOSED", "ARCHIVED", "unknown"])
    assert.ok(publicOpportunityStatus(status).error);
});

test("opportunity lifecycle transitions are explicit and archived is terminal", () => {
  assert.equal(isAllowedOpportunityTransition("DRAFT", "OPEN"), true);
  assert.equal(isAllowedOpportunityTransition("DRAFT", "ARCHIVED"), true);
  assert.equal(isAllowedOpportunityTransition("OPEN", "CLOSED"), true);
  assert.equal(isAllowedOpportunityTransition("OPEN", "ARCHIVED"), true);
  assert.equal(isAllowedOpportunityTransition("CLOSED", "OPEN"), true);
  assert.equal(isAllowedOpportunityTransition("CLOSED", "ARCHIVED"), true);
  assert.equal(isAllowedOpportunityTransition("DRAFT", "CLOSED"), false);
  assert.equal(isAllowedOpportunityTransition("ARCHIVED", "OPEN"), false);
});

test("malformed JSON parser errors receive the shared 400 JSON response", () => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; },
  };
  const error = new SyntaxError("Unexpected token");
  error.status = 400;
  error.body = "{";
  error.type = "entity.parse.failed";
  errorHandler(error, {}, res, () => {});
  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.body, { success: false, message: "Request body contains malformed JSON" });
});

test("foreign-key conflicts receive a safe conflict response", () => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; },
  };
  errorHandler({ code: "P2003" }, {}, res, () => {});
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.success, false);
});
