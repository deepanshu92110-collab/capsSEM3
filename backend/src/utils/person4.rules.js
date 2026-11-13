import { parseIsoDate } from "./industry.validation.js";

export function companyOwnsResource(resourceCompanyId, actingCompanyId) {
  return Boolean(resourceCompanyId && actingCompanyId && resourceCompanyId === actingCompanyId);
}

export function isInterviewEligible(status) {
  return status === "SHORTLISTED" || status === "SELECTED";
}

export function validateInternshipPeriod(startValue, endValue) {
  const parse = (value, field) => {
    if (value === undefined || value === null || value === "") return { date: null };
    const date = parseIsoDate(value);
    return date ? { date } : { error: `${field} must be a valid ISO 8601 timestamp with timezone` };
  };
  const start = parse(startValue, "startDate");
  if (start.error) return { error: start.error };
  const end = parse(endValue, "endDate");
  if (end.error) return { error: end.error };
  if (start.date && end.date && end.date < start.date) return { error: "endDate must be on or after startDate" };
  return { startDate: start.date, endDate: end.date };
}

export async function hasSelectedCompanyApplication(prisma, studentProfileId, companyId) {
  if (!studentProfileId || !companyId) return false;
  const application = await prisma.application.findFirst({
    where: {
      studentProfileId,
      status: "SELECTED",
      opportunity: { companyId },
    },
    select: { id: true },
  });
  return Boolean(application);
}

export function calculatePlacementRate(studentCount, placementRows) {
  if (!studentCount || studentCount < 1) return 0;
  const placedStudentIds = new Set(placementRows.map(row => row.studentProfileId));
  return Math.min(placedStudentIds.size / studentCount, 1);
}

export async function canAccessResumeFile(prisma, user, filePath) {
  if (user.role === "ADMIN") return true;
  if (user.role === "STUDENT") {
    return Boolean(await prisma.studentProfile.findFirst({
      where: { userId: user.id, resumeUrl: filePath }, select: { id: true },
    }));
  }
  if (user.role === "INSTITUTION") {
    const institution = await prisma.institution.findUnique({
      where: { userId: user.id }, select: { id: true },
    });
    if (!institution) return false;
    return Boolean(await prisma.studentProfile.findFirst({
      where: { institutionId: institution.id, resumeUrl: filePath }, select: { id: true },
    }));
  }
  if (user.role === "INDUSTRY") {
    const company = await prisma.company.findUnique({
      where: { userId: user.id }, select: { id: true },
    });
    if (!company) return false;
    return Boolean(await prisma.application.findFirst({
      where: { opportunity: { companyId: company.id }, studentProfile: { resumeUrl: filePath } },
      select: { id: true },
    }));
  }
  return false;
}
