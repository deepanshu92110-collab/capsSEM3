import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const fields = [
  "institutionId",
  "degree",
  "department",
  "graduationYear",
  "semester",
  "bio",
  "profileImage",
  "resumeUrl",
  "linkedIn",
  "github",
  "portfolio",
];
function profileData(body) {
  const data = {};
  for (const key of fields)
    if (body[key] !== undefined)
      data[key] = body[key] === "" ? null : body[key];
  return data;
}
function validProfile(data) {
  return (
    (!data.graduationYear ||
      (Number.isInteger(data.graduationYear) &&
        data.graduationYear >= 2000 &&
        data.graduationYear <= 2100)) &&
    (!data.semester ||
      (Number.isInteger(data.semester) &&
        data.semester >= 1 &&
        data.semester <= 12))
  );
}
export const getOwnStudent = asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: req.user.id },
    include: {
      institution: { select: { id: true, name: true, isVerified: true } },
      user: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });
  res.json({ success: true, data: { profile } });
});
export const createStudent = asyncHandler(async (req, res) => {
  const data = profileData(req.body || {});
  if (!validProfile(data))
    return res
      .status(400)
      .json({ success: false, message: "Invalid graduationYear or semester" });
  const profile = await prisma.studentProfile.upsert({
    where: { userId: req.user.id },
    create: { userId: req.user.id, ...data },
    update: data,
    include: { institution: true },
  });
  res.status(201).json({ success: true, data: { profile } });
});
export const updateStudent = asyncHandler(async (req, res) => {
  const data = profileData(req.body || {});
  if (!Object.keys(data).length)
    return res
      .status(400)
      .json({ success: false, message: "Provide at least one profile field" });
  if (!validProfile(data))
    return res
      .status(400)
      .json({ success: false, message: "Invalid graduationYear or semester" });
  const profile = await prisma.studentProfile.upsert({
    where: { userId: req.user.id },
    create: { userId: req.user.id, ...data },
    update: data,
    include: { institution: true },
  });
  res.json({ success: true, data: { profile } });
});
export const getStudent = asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({
    where: { OR: [{ id: req.params.id }, { userId: req.params.id }] },
    include: {
      institution: { select: { id: true, name: true, isVerified: true } },
      user: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });
  if (!profile)
    return res
      .status(404)
      .json({ success: false, message: "Student profile not found" });
  res.json({ success: true, data: { profile } });
});
export const uploadStudentFile = asyncHandler(async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "Upload a file in the file field" });
  const field = req.path.includes("resume") ? "resumeUrl" : "profileImage";
  const value = `/uploads/${req.file.filename}`;
  const profile = await prisma.studentProfile.upsert({
    where: { userId: req.user.id },
    create: { userId: req.user.id, [field]: value },
    update: { [field]: value },
  });
  res.json({ success: true, data: { profile } });
});
