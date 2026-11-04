import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const fields = [
  "name",
  "officialEmail",
  "website",
  "address",
  "description",
  "contactInfo",
];
function dataOf(body) {
  const data = {};
  for (const key of fields)
    if (body[key] !== undefined)
      data[key] = body[key] === "" ? null : body[key];
  return data;
}
export const createInstitution = asyncHandler(async (req, res) => {
  const data = dataOf(req.body || {});
  const institution = await prisma.institution.upsert({
    where: { userId: req.user.id },
    create: {
      userId: req.user.id,
      name: data.name || req.user.fullName,
      officialEmail: data.officialEmail || req.user.email,
      ...data,
    },
    update: data,
  });
  res.status(201).json({ success: true, data: { institution } });
});
export const getOwnInstitution = asyncHandler(async (req, res) => {
  const institution = await prisma.institution.findUnique({
    where: { userId: req.user.id },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });
  res.json({ success: true, data: { institution } });
});
export const updateInstitution = asyncHandler(async (req, res) => {
  const data = dataOf(req.body || {});
  if (!Object.keys(data).length)
    return res
      .status(400)
      .json({
        success: false,
        message: "Provide at least one institution field",
      });
  const institution = await prisma.institution.update({
    where: { userId: req.user.id },
    data,
  });
  res.json({ success: true, data: { institution } });
});
export const getInstitution = asyncHandler(async (req, res) => {
  const institution = await prisma.institution.findFirst({
    where: { OR: [{ id: req.params.id }, { userId: req.params.id }] },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });
  if (!institution)
    return res
      .status(404)
      .json({ success: false, message: "Institution not found" });
  res.json({ success: true, data: { institution } });
});
export const verifyInstitution = asyncHandler(async (req, res) => {
  if (typeof req.body?.isVerified !== "boolean")
    return res
      .status(400)
      .json({ success: false, message: "isVerified must be a boolean" });
  const institution = await prisma.institution.update({
    where: { id: req.params.id },
    data: { isVerified: req.body.isVerified },
  });
  res.json({ success: true, data: { institution } });
});
export const verifyCompany = asyncHandler(async (req, res) => {
  if (typeof req.body?.isVerified !== "boolean")
    return res
      .status(400)
      .json({ success: false, message: "isVerified must be a boolean" });
  const company = await prisma.company.update({
    where: { id: req.params.id },
    data: { isVerified: req.body.isVerified },
  });
  res.json({ success: true, data: { company } });
});
