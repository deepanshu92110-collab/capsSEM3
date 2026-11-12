import { proficiency } from "./proficiency.js";

export function scoreSkills(studentSkills, requiredSkills) {
  const owned = new Map(studentSkills.map((entry) => [entry.skill.name.toLowerCase(), entry]));
  let possible = 0, earned = 0;
  const matched = [], partial = [], missing = [], calculations = [];
  for (const requirement of requiredSkills) {
    const weight = Number(requirement.weight) > 0 ? Number(requirement.weight) : 1;
    const key = (requirement.skill?.name ?? requirement.name).toLowerCase();
    const student = owned.get(key);
    const requiredLevel = requirement.proficiencyLevel ?? requirement.requiredProficiency ?? "BEGINNER";
    const current = student?.proficiencyLevel;
    const difference = current ? proficiency[current] - proficiency[requiredLevel] : null;
    const fraction = difference === null || difference < -1 ? 0 : difference >= 0 ? 1 : 0.5;
    possible += weight; earned += weight * fraction;
    const item = { skill: requirement.skill?.name ?? requirement.name, weight, currentProficiency: current ?? null, requiredProficiency: requiredLevel, earnedWeight: weight * fraction, reason: !current ? "No student skill record exists" : difference >= 0 ? `Current level ${current} meets or exceeds ${requiredLevel}` : difference === -1 ? `Current level ${current} is one level below ${requiredLevel}` : `Current level ${current} is at least two levels below ${requiredLevel}`, suggestedNextLevel: current ? (proficiency[current] < proficiency[requiredLevel] ? Object.keys(proficiency).find((level) => proficiency[level] === proficiency[current] + 1) : null) : "BEGINNER" };
    calculations.push(item);
    if (!current || fraction === 0) missing.push(item);
    else if (fraction === 1) matched.push(item);
    else partial.push(item);
  }
  return { percentage: possible ? Math.round((earned / possible) * 100) : 0, earnedPoints: earned, possiblePoints: possible, matched, partiallyMatched: partial, missing, calculations, formula: "sum(weight × earned fraction) / sum(weight) × 100; full=1, one level below=0.5, missing or 2+ levels below=0" };
}
