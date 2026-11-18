import test from "node:test";
import assert from "node:assert/strict";
import { publicOpportunityWhere } from "../src/utils/publicOpportunity.js";
import { studentProfileAccessWhere } from "../src/utils/studentAccess.js";
import { validStudentProfile } from "../src/utils/studentProfile.validation.js";

test("public opportunity queries require OPEN status and a verified company", () => {
  assert.deepEqual(publicOpportunityWhere(), {
    status: "OPEN",
    company: { isVerified: true },
  });
  assert.deepEqual(publicOpportunityWhere({ id: "opportunity-1" }), {
    id: "opportunity-1",
    status: "OPEN",
    company: { isVerified: true },
  });
});

test("student profile numeric limits reject zero while allowing cleared optional fields", () => {
  assert.equal(validStudentProfile({ graduationYear: 0 }), false);
  assert.equal(validStudentProfile({ semester: 0 }), false);
  assert.equal(validStudentProfile({ graduationYear: null, semester: null }), true);
  assert.equal(validStudentProfile({ graduationYear: 2028, semester: 3 }), true);
});

test("student profile access is scoped by role and requested profile", () => {
  assert.deepEqual(
    studentProfileAccessWhere({
      user: { id: "student-user", role: "STUDENT" },
      requestedId: "student-profile",
    }),
    {
      AND: [
        { OR: [{ id: "student-profile" }, { userId: "student-profile" }] },
        { userId: "student-user" },
      ],
    },
  );
  assert.deepEqual(
    studentProfileAccessWhere({
      user: { id: "institution-user", role: "INSTITUTION" },
      requestedId: "student-profile",
      institutionId: "institution-1",
    }).AND[1],
    { institutionId: "institution-1" },
  );
  assert.deepEqual(
    studentProfileAccessWhere({
      user: { id: "industry-user", role: "INDUSTRY" },
      requestedId: "student-profile",
      companyId: "company-1",
    }).AND[1],
    { applications: { some: { opportunity: { companyId: "company-1" } } } },
  );
  assert.equal(
    studentProfileAccessWhere({
      user: { id: "industry-user", role: "INDUSTRY" },
      requestedId: "student-profile",
    }),
    null,
  );
});
