import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { scoreSkills } from "../utils/matchingAlgorithm.js";
import { nextLevel } from "../utils/proficiency.js";
import { suggestionsFor } from "../services/recommendation.service.js";
import { mentionsSkill } from "../utils/skillText.js";

function opportunityRequirements(opportunity, skills) {
  const text = [opportunity.title, opportunity.description, opportunity.responsibilities, opportunity.qualifications].filter(Boolean).join("\n").toLowerCase();
  return skills.filter((skill) => mentionsSkill(text, skill.name)).map((skill) => ({ skill, name: skill.name, proficiencyLevel: "INTERMEDIATE", weight: 1 }));
}
async function ownStudent(userId) { return prisma.studentProfile.findUnique({ where: { userId }, include: { skills: { include: { skill: true } } } }); }
export const gapMe = asyncHandler(async (req, res) => {
  const student = await ownStudent(req.user.id); if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });
  const portfolio = student.skills;
  const referenceSkills = await prisma.skill.findMany();
  const analysis = scoreSkills(portfolio, referenceSkills.map((skill) => ({ skill, proficiencyLevel: "INTERMEDIATE", weight: 1 })));
  const normalize = (items) => items.map((item) => ({ ...item, suggestedNextLevel: item.suggestedNextLevel ?? nextLevel(item.currentProficiency) }));
  res.json({ success: true, data: { ...analysis, matched: normalize(analysis.matched), partiallyMatched: normalize(analysis.partiallyMatched), missing: normalize(analysis.missing), note: "For a general profile gap, the baseline requirement is INTERMEDIATE for each catalog skill." } });
});
export const gapOpportunity = asyncHandler(async (req, res) => {
  const student = await ownStudent(req.user.id); if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });
  const opportunity = await prisma.opportunity.findFirst({ where: { id: req.params.opportunityId, status: "OPEN" }, include: { company: { select: { name: true } } } });
  if (!opportunity) return res.status(404).json({ success: false, message: "Opportunity not found" });
  const skills = await prisma.skill.findMany();
  const requiredSkills = opportunityRequirements(opportunity, skills);
  if (!requiredSkills.length) return res.status(422).json({ success: false, message: "No catalog skills were identified in the opportunity text. Add structured required skills with Person 3 to enable precise matching." });
  const result = scoreSkills(student.skills, requiredSkills);
  const recommendations = result.missing.map((item) => ({ ...item, recommendations: suggestionsFor(requiredSkills.find((required) => required.skill.name === item.skill).skill, item.reason, 1) }));
  res.json({ success: true, data: { opportunity: { id: opportunity.id, title: opportunity.title, company: opportunity.company.name }, ...result, recommendations, matchingBasis: "Skills detected in the published opportunity title and description fields; current catalog matching uses INTERMEDIATE as the default required level." } });
});
