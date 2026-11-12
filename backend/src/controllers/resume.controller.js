import { readFile } from "node:fs/promises";
import path from "node:path";
import pdf from "pdf-parse";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mentionsSkill } from "../utils/skillText.js";
const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
export const extractResumeSkills = asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile?.resumeUrl) return res.status(404).json({ success: false, message: "Upload a PDF resume to your student profile first" });
  const filePath = path.resolve("uploads", path.basename(profile.resumeUrl));
  let parsed;
  try { parsed = await pdf(await readFile(filePath)); }
  catch { return res.status(422).json({ success: false, message: "Resume PDF could not be read. Re-upload a valid PDF and try again." }); }
  const text = parsed.text.toLowerCase();
  const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  const extractedSkills = skills.filter((skill) => mentionsSkill(text, skill.name)).map(({ id, name, category, description }) => ({ skillId: id, name, category, description }));
  res.json({ success: true, data: { extractedSkills, textLength: parsed.text.length, message: extractedSkills.length ? "Review these detected skills and choose which to add." : "No catalog skills were detected in this resume." } });
});
export const approveResumeSkills = asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ success: false, message: "Student profile not found" });
  const skills = req.body?.skills;
  if (!Array.isArray(skills) || !skills.length || skills.length > 100) return res.status(400).json({ success: false, message: "skills must be a non-empty array of skillId and proficiencyLevel choices" });
  if (skills.some((entry) => !entry?.skillId || !levels.includes(entry.proficiencyLevel))) return res.status(400).json({ success: false, message: "Each item requires skillId and a valid proficiencyLevel" });
  const ids = skills.map((entry) => entry.skillId);
  const known = await prisma.skill.count({ where: { id: { in: ids } } });
  if (known !== new Set(ids).size) return res.status(400).json({ success: false, message: "One or more skills are invalid or duplicated" });
  const saved = [];
  for (const entry of skills) {
    const row = await prisma.studentSkill.upsert({ where: { studentProfileId_skillId: { studentProfileId: profile.id, skillId: entry.skillId } }, create: { studentProfileId: profile.id, skillId: entry.skillId, proficiencyLevel: entry.proficiencyLevel, source: "RESUME" }, update: { proficiencyLevel: entry.proficiencyLevel, source: "RESUME" }, include: { skill: true } });
    saved.push(row);
  }
  res.status(201).json({ success: true, data: { skills: saved } });
});
