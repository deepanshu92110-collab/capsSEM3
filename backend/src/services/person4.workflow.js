export async function submitApplication({ prisma, profile, opportunity, userId, coverLetter, include }) {
  const existing = await prisma.application.findUnique({
    where: { studentProfileId_opportunityId: { studentProfileId: profile.id, opportunityId: opportunity.id } },
    select: { id: true },
  });
  if (existing) return { duplicate: true };

  const application = await prisma.$transaction(async tx => {
    const created = await tx.application.create({
      data: { studentProfileId: profile.id, opportunityId: opportunity.id, coverLetter },
      ...(include ? { include } : {}),
    });
    await tx.applicationStatusHistory.create({
      data: { applicationId: created.id, status: "SUBMITTED", changedByUserId: userId },
    });
    const company = await tx.opportunity.findUnique({
      where: { id: opportunity.id }, select: { company: { select: { userId: true } } },
    });
    await tx.notification.create({
      data: {
        userId: company.company.userId,
        type: "APPLICATION_SUBMITTED",
        title: "New application received",
        message: `A new application was submitted for ${opportunity.title}.`,
        link: "/industry/applicants",
      },
    });
    return created;
  });
  return { application };
}
