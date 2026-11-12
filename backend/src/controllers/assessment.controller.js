import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { classifyPercentage } from "../utils/proficiency.js";
async function profile(userId) { return prisma.studentProfile.findUnique({ where: { userId } }); }
export const listAssessments = asyncHandler(async (req, res) => {
  const assessments = await prisma.assessment.findMany({ include: { skill: true }, orderBy: [{ skill: { name: "asc" } }, { title: "asc" }] });
  res.json({ success: true, data: { assessments } });
});
export const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { skill: true, questions: { select: { id: true, question: true, options: true } } } });
  if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });
  res.json({ success: true, data: { assessment } });
});
export const submitAssessment = asyncHandler(async (req, res) => {
  const student = await profile(req.user.id); if (!student) return res.status(404).json({ success: false, message: "Initialize your student profile first" });
  const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { questions: true, skill: true } });
  if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });
  const answers = req.body?.answers;
  if (!Array.isArray(answers) || answers.length !== assessment.questions.length || answers.some((answer) => !Number.isInteger(answer) || answer < 0 || answer > 3)) return res.status(400).json({ success: false, message: "answers must contain one option index (0–3) for each question, in displayed order" });
  const score = assessment.questions.reduce((total, question, index) => total + (question.correctAnswer === answers[index] ? 1 : 0), 0);
  const percentage = assessment.questions.length ? Math.round(score / assessment.questions.length * 100) : 0;
  const proficiencyLevel = classifyPercentage(percentage);
  const result = await prisma.assessmentResult.create({ data: { studentProfileId: student.id, assessmentId: assessment.id, score, percentage, proficiencyLevel } });
  await prisma.studentSkill.upsert({ where: { studentProfileId_skillId: { studentProfileId: student.id, skillId: assessment.skillId } }, create: { studentProfileId: student.id, skillId: assessment.skillId, proficiencyLevel, source: "ASSESSMENT" }, update: { proficiencyLevel, source: "ASSESSMENT" } });
  res.status(201).json({ success: true, data: { result: { ...result, assessment: { title: assessment.title, skill: assessment.skill } } } });
});
export const myResults = asyncHandler(async (req, res) => {
  const student = await profile(req.user.id); if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });
  const results = await prisma.assessmentResult.findMany({ where: { studentProfileId: student.id }, include: { assessment: { include: { skill: true } } }, orderBy: { completedAt: "desc" } });
  res.json({ success: true, data: { results } });
});
export const getResult = asyncHandler(async (req, res) => {
  const student = await profile(req.user.id); if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });
  const result = await prisma.assessmentResult.findFirst({ where: { id: req.params.id, studentProfileId: student.id }, include: { assessment: { include: { skill: true } } } });
  if (!result) return res.status(404).json({ success: false, message: "Assessment result not found" });
  res.json({ success: true, data: { result } });
});
