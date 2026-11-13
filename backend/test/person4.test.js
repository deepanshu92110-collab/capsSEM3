import test from "node:test";
import assert from "node:assert/strict";
import { canAccessResumeFile, calculatePlacementRate, companyOwnsResource, hasSelectedCompanyApplication, isInterviewEligible, validateInternshipPeriod } from "../src/utils/person4.rules.js";
import { submitApplication } from "../src/services/person4.workflow.js";

test("duplicate application workflow returns a conflict before writes", async () => {
  let transactionStarted = false;
  const fakePrisma = {
    application: { findUnique: async ({ where }) => {
      assert.deepEqual(where.studentProfileId_opportunityId, { studentProfileId: "student-1", opportunityId: "opportunity-1" });
      return { id: "existing-application" };
    } },
    $transaction: async () => { transactionStarted = true; },
  };
  const result = await submitApplication({ prisma: fakePrisma, profile: { id: "student-1" }, opportunity: { id: "opportunity-1" }, userId: "user-1", coverLetter: null });
  assert.equal(result.duplicate, true);
  assert.equal(transactionStarted, false);
});

test("company ownership check rejects a different company's user", () => {
  assert.equal(companyOwnsResource("company-A", "company-A"), true);
  assert.equal(companyOwnsResource("company-A", "company-B"), false);
  assert.equal(companyOwnsResource("company-A", undefined), false);
});

test("placement eligibility requires a selected application under the same company", async () => {
  const queries = [];
  const fakePrisma = { application: { findFirst: async value => { queries.push(value); return value.where.opportunity.companyId === "company-A" ? { id: "selected-app" } : null; } } };
  assert.equal(await hasSelectedCompanyApplication(fakePrisma, "student-1", "company-A"), true);
  assert.equal(await hasSelectedCompanyApplication(fakePrisma, "student-1", "company-B"), false);
  assert.deepEqual(queries[0].where, { studentProfileId: "student-1", status: "SELECTED", opportunity: { companyId: "company-A" } });
});

test("PDF access is scoped to the student's company or institution", async () => {
  const queries = [];
  const fakePrisma = {
    company: { findUnique: async ({ where }) => ({ id: where.userId === "industry-A" ? "company-A" : "company-B" }) },
    application: { findFirst: async query => { queries.push(query); return query.where.opportunity.companyId === "company-A" ? { id: "application-A" } : null; } },
    institution: { findUnique: async () => ({ id: "institution-A" }) },
    studentProfile: { findFirst: async query => { queries.push(query); return null; } },
  };
  assert.equal(await canAccessResumeFile(fakePrisma, { id: "industry-A", role: "INDUSTRY" }, "/uploads/resume.pdf"), true);
  assert.equal(await canAccessResumeFile(fakePrisma, { id: "industry-B", role: "INDUSTRY" }, "/uploads/resume.pdf"), false);
  assert.equal(queries[0].where.opportunity.companyId, "company-A");
  assert.equal(await canAccessResumeFile(fakePrisma, { id: "institution-user", role: "INSTITUTION" }, "/uploads/resume.pdf"), false);
  assert.equal(await canAccessResumeFile(fakePrisma, { id: "admin", role: "ADMIN" }, "/uploads/resume.pdf"), true);
});

test("interview eligibility allows shortlisted or selected applications only", () => {
  assert.equal(isInterviewEligible("SHORTLISTED"), true);
  assert.equal(isInterviewEligible("SELECTED"), true);
  for (const status of ["SUBMITTED", "UNDER_REVIEW", "REJECTED", "WITHDRAWN"]) assert.equal(isInterviewEligible(status), false);
});

test("internship date validation rejects invalid and reversed dates", () => {
  assert.match(validateInternshipPeriod("2099-02-30T10:00:00Z", "2099-03-01T10:00:00Z").error, /startDate/);
  assert.match(validateInternshipPeriod("2099-03-02T10:00:00Z", "2099-03-01T10:00:00Z").error, /on or after/);
  assert.deepEqual(validateInternshipPeriod(undefined, undefined), { startDate: null, endDate: null });
});

test("application history and notification are part of the write transaction", async () => {
  let transactionActive = false;
  let notificationData;
  const tx = {
    application: { create: async () => { assert.equal(transactionActive, true); return { id: "app-1" }; } },
    applicationStatusHistory: { create: async ({ data }) => { assert.equal(transactionActive, true); assert.equal(data.status, "SUBMITTED"); } },
    opportunity: { findUnique: async () => ({ company: { userId: "company-user" } }) },
    notification: { create: async ({ data }) => { assert.equal(transactionActive, true); notificationData = data; } },
  };
  const fakePrisma = {
    application: { findUnique: async () => null },
    $transaction: async callback => { transactionActive = true; try { return await callback(tx); } finally { transactionActive = false; } },
  };
  const result = await submitApplication({ prisma: fakePrisma, profile: { id: "student-1" }, opportunity: { id: "opp-1", title: "Analyst" }, userId: "student-user", coverLetter: null });
  assert.equal(result.application.id, "app-1");
  assert.equal(notificationData.userId, "company-user");
  assert.equal(notificationData.type, "APPLICATION_SUBMITTED");
  assert.equal(transactionActive, false);
});

test("notification failure rejects the application transaction", async () => {
  const committed = [];
  const fakePrisma = {
    application: { findUnique: async () => null },
    $transaction: async callback => {
      const pending = [];
      try {
        const result = await callback({
          application: { create: async () => { pending.push("application"); return { id: "app-1" }; } },
          applicationStatusHistory: { create: async () => { pending.push("history"); } },
          opportunity: { findUnique: async () => ({ company: { userId: "company-user" } }) },
          notification: { create: async () => { pending.push("notification"); throw new Error("notification unavailable"); } },
        });
        committed.push(...pending);
        return result;
      } catch (error) {
        throw error;
      }
    },
  };
  await assert.rejects(submitApplication({ prisma: fakePrisma, profile: { id: "student-1" }, opportunity: { id: "opp-1", title: "Analyst" }, userId: "student-user", coverLetter: null }), /notification unavailable/);
  assert.deepEqual(committed, []);
});

test("admin placement rate uses distinct students and cannot exceed 100 percent", () => {
  assert.equal(calculatePlacementRate(3, [{ studentProfileId: "s1" }, { studentProfileId: "s1" }, { studentProfileId: "s2" }]), 2 / 3);
  assert.equal(calculatePlacementRate(2, [{ studentProfileId: "s1" }, { studentProfileId: "s2" }, { studentProfileId: "s3" }]), 1);
  assert.equal(calculatePlacementRate(0, [{ studentProfileId: "s1" }]), 0);
});
