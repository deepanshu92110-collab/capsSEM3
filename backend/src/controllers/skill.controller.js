import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
async function ownProfile(userId) { return prisma.studentProfile.findUnique({ where: { userId } }); }
export const listSkills = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.category) where.category = { equals: String(req.query.category), mode: "insensitive" };
  if (req.query.search) where.name = { contains: String(req.query.search).slice(0, 100), mode: "insensitive" };
  const skills = await prisma.skill.findMany({ where, orderBy: [{ category: "asc" }, { name: "asc" }] });
  res.json({ success: true, data: { skills } });
});
export const getSkill = asyncHandler(async (req, res) => {
  const skill = await prisma.skill.findUnique({ where: { id: req.params.id } });
  if (!skill) return res.status(404).json({ success: false, message: "Skill not found" });
  res.json({ success: true, data: { skill } });
});
export const createSkill = asyncHandler(async (req, res) => {
  const { name, category, description } = req.body || {};
  if (typeof name !== "string" || !name.trim() || typeof category !== "string" || !category.trim()) return res.status(400).json({ success: false, message: "name and category are required" });
  const skill = await prisma.skill.create({ data: { name: name.trim(), category: category.trim(), description: typeof description === "string" ? description.trim() : null } });
  res.status(201).json({ success: true, data: { skill } });
});
export const mySkills = asyncHandler(async (req, res) => {
  const profile = await ownProfile(req.user.id);
  if (!profile) return res.status(404).json({ success: false, message: "Initialize your student profile first" });
  const skills = await prisma.studentSkill.findMany({ where: { studentProfileId: profile.id }, include: { skill: true }, orderBy: { skill: { name: "asc" } } });
  res.json({ success: true, data: { skills } });
});
export const addMySkill = asyncHandler(async (req, res) => {
  const profile = await ownProfile(req.user.id); if (!profile) return res.status(404).json({ success: false, message: "Initialize your student profile first" });
  const { skillId, proficiencyLevel } = req.body || {};
  if (!skillId || !levels.includes(proficiencyLevel)) return res.status(400).json({ success: false, message: "skillId and valid proficiencyLevel are required" });
  const record = await prisma.studentSkill.upsert({ where: { studentProfileId_skillId: { studentProfileId: profile.id, skillId } }, create: { studentProfileId: profile.id, skillId, proficiencyLevel }, update: { proficiencyLevel } });
  res.status(201).json({ success: true, data: { studentSkill: record } });
});
export const updateMySkill = asyncHandler(async (req, res) => {
  const profile = await ownProfile(req.user.id); if (!profile) return res.status(404).json({ success: false, message: "Student profile not found" });
  const { proficiencyLevel } = req.body || {}; if (!levels.includes(proficiencyLevel)) return res.status(400).json({ success: false, message: "Valid proficiencyLevel is required" });
  const record = await prisma.studentSkill.update({ where: { studentProfileId_skillId: { studentProfileId: profile.id, skillId: req.params.skillId } }, data: { proficiencyLevel } });
  res.json({ success: true, data: { studentSkill: record } });
});
export const deleteMySkill = asyncHandler(async (req, res) => {
  const profile = await ownProfile(req.user.id); if (!profile) return res.status(404).json({ success: false, message: "Student profile not found" });
  await prisma.studentSkill.delete({ where: { studentProfileId_skillId: { studentProfileId: profile.id, skillId: req.params.skillId } } });
  res.json({ success: true, message: "Skill removed from your profile" });
});
