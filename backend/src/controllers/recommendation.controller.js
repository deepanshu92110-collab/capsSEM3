import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { suggestionsFor } from "../services/recommendation.service.js";
import { mentionsSkill } from "../utils/skillText.js";
async function student(userId) { return prisma.studentProfile.findUnique({ where: { userId }, include: { skills: { include: { skill: true } } } }); }
export const listRecommendations = asyncHandler(async (req, res) => {
  const profile = await student(req.user.id); if (!profile) return res.status(404).json({ success: false, message: "Student profile not found" });
  const recs = await prisma.learningRecommendation.findMany({ where: { studentProfileId: profile.id }, include: { skill: true }, orderBy: [{ isCompleted: "asc" }, { priority: "asc" }, { createdAt: "desc" }] });
  res.json({ success: true, data: { recommendations: recs } });
});
export const refreshRecommendations = asyncHandler(async (req, res) => {
  const profile = await student(req.user.id); if (!profile) return res.status(404).json({ success: false, message: "Student profile not found" });
  const skills = await prisma.skill.findMany();
  const existing = new Set(profile.skills.map((x) => x.skillId));
  const open = await prisma.opportunity.findMany({ where: { status: "OPEN" }, select: { title: true, description: true, responsibilities: true, qualifications: true } });
  const opportunityText = open.map((item) => [item.title, item.description, item.responsibilities, item.qualifications].filter(Boolean).join(" ").toLowerCase()).join(" ");
  const missing = skills.filter((skill) => !existing.has(skill.id));
  for (const skill of missing) {
    const isRelevant = mentionsSkill(opportunityText, skill.name);
    for (const data of suggestionsFor(skill, isRelevant ? "This skill appears in an open opportunity and is not yet in your portfolio" : "This skill is not yet in your skill portfolio", isRelevant ? 1 : 3)) {
    const found = await prisma.learningRecommendation.findFirst({ where: { studentProfileId: profile.id, skillId: skill.id, title: data.title, isCompleted: false } });
      if (!found) await prisma.learningRecommendation.create({ data: { ...data, studentProfileId: profile.id } });
    }
  }
  const recommendations = await prisma.learningRecommendation.findMany({ where: { studentProfileId: profile.id }, include: { skill: true }, orderBy: [{ isCompleted: "asc" }, { priority: "asc" }, { createdAt: "desc" }] });
  res.json({ success: true, data: { recommendations } });
});
export const completeRecommendation = asyncHandler(async (req, res) => {
  const profile = await student(req.user.id); if (!profile) return res.status(404).json({ success: false, message: "Student profile not found" });
  const recommendation = await prisma.learningRecommendation.findFirst({ where: { id: req.params.id, studentProfileId: profile.id } });
  if (!recommendation) return res.status(404).json({ success: false, message: "Recommendation not found" });
  const updated = await prisma.learningRecommendation.update({ where: { id: recommendation.id }, data: { isCompleted: req.body?.isCompleted === undefined ? true : Boolean(req.body.isCompleted) } });
  res.json({ success: true, data: { recommendation: updated } });
});
