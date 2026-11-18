export function publicOpportunityWhere(extra = {}) {
  return {
    ...extra,
    status: "OPEN",
    company: { isVerified: true },
  };
}
