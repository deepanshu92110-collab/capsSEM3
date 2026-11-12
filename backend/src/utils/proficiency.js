export const proficiency = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };
export function classifyPercentage(value) {
  if (value >= 90) return "EXPERT";
  if (value >= 75) return "ADVANCED";
  if (value >= 50) return "INTERMEDIATE";
  return "BEGINNER";
}
export const nextLevel = (level) => ({ BEGINNER: "INTERMEDIATE", INTERMEDIATE: "ADVANCED", ADVANCED: "EXPERT", EXPERT: null })[level] ?? null;
