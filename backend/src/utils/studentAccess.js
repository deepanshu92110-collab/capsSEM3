export function studentProfileAccessWhere({ user, requestedId, institutionId, companyId }) {
  const requestedProfile = { OR: [{ id: requestedId }, { userId: requestedId }] };
  let accessScope;

  if (user.role === "ADMIN") return requestedProfile;
  if (user.role === "STUDENT") accessScope = { userId: user.id };
  if (user.role === "INSTITUTION" && institutionId)
    accessScope = { institutionId };
  if (user.role === "INDUSTRY" && companyId)
    accessScope = { applications: { some: { opportunity: { companyId } } } };

  if (!accessScope) return null;
  return { AND: [requestedProfile, accessScope] };
}
