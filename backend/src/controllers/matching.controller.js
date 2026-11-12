import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { scoreSkills } from "../utils/matchingAlgorithm.js";
import { gapOpportunity } from "./skillGap.controller.js";
import { mentionsSkill } from "../utils/skillText.js";

export const matchOpportunities = asyncHandler(async (req, res) => {
  const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.id }, include: { skills: { include: { skill: true } } } });
  if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });
  const opportunities = await prisma.opportunity.findMany({ where: { status: "OPEN" }, include: { company: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  const skills = await prisma.skill.findMany();
  const results = opportunities.map((opportunity) => {
    const text = [opportunity.title, opportunity.description, opportunity.responsibilities, opportunity.qualifications].filter(Boolean).join(" ").toLowerCase();
    const requiredSkills = skills.filter((skill) => mentionsSkill(text, skill.name)).map((skill) => ({ skill, proficiencyLevel: "INTERMEDIATE", weight: 1 }));
    return { opportunity: { id: opportunity.id, title: opportunity.title, company: opportunity.company.name, location: opportunity.location }, ...scoreSkills(student.skills, requiredSkills), requiredSkillCount: requiredSkills.length };
  }).sort((a, b) => b.percentage - a.percentage || a.opportunity.title.localeCompare(b.opportunity.title));
  res.json({ success: true, data: { opportunities: results, note: "Opportunity skills are currently inferred from text and use an INTERMEDIATE baseline. Structured weights and required levels should come from Person 3's RequiredSkill model." } });
});
export const matchOpportunity = asyncHandler(async (req, res) => {
  req.params.opportunityId = req.params.opportunityId || req.params.id;
  return gapOpportunity(req, res);
});
