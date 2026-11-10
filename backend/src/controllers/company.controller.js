import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { MAX_TEXT_LENGTHS, validateHttpUrl } from "../utils/industry.validation.js";

const fields = ["name", "officialEmail", "website", "address", "description", "contactInfo"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getOwnCompany = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { userId: req.user.id },
    select: {
      id: true,
      userId: true,
      name: true,
      officialEmail: true,
      website: true,
      address: true,
      description: true,
      contactInfo: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!company)
    return res.status(404).json({ success: false, message: "Company profile not found" });
  res.json({ success: true, data: { company } });
});

export const updateOwnCompany = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const unknown = Object.keys(body).filter((key) => !fields.includes(key));
  if (unknown.length)
    return res.status(400).json({ success: false, message: `Unsupported company field: ${unknown[0]}` });
  const data = {};
  for (const key of fields) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "string")
        return res.status(400).json({ success: false, message: `${key} must be a string` });
      const value = body[key].trim();
      if (key === "name" || key === "officialEmail") {
        if (!value)
          return res.status(400).json({ success: false, message: `${key} cannot be empty` });
        data[key] = key === "officialEmail" ? value.toLowerCase() : value;
      } else data[key] = value || null;
      const maxLength = {
        name: MAX_TEXT_LENGTHS.companyName,
        officialEmail: MAX_TEXT_LENGTHS.officialEmail,
        website: MAX_TEXT_LENGTHS.website,
        address: MAX_TEXT_LENGTHS.address,
        description: MAX_TEXT_LENGTHS.companyDescription,
        contactInfo: MAX_TEXT_LENGTHS.contactInfo,
      }[key];
      if (value.length > maxLength)
        return res.status(400).json({ success: false, message: `${key} must be at most ${maxLength} characters` });
    }
  }
  if (!Object.keys(data).length)
    return res.status(400).json({ success: false, message: "Provide at least one company field" });
  if (data.officialEmail && !emailPattern.test(data.officialEmail))
    return res.status(400).json({ success: false, message: "officialEmail must be a valid email address" });
  if (data.website && !validateHttpUrl(data.website))
    return res.status(400).json({ success: false, message: "website must be a valid HTTP or HTTPS URL" });
  const company = await prisma.company.update({
    where: { userId: req.user.id },
    data,
    select: {
      id: true,
      userId: true,
      name: true,
      officialEmail: true,
      website: true,
      address: true,
      description: true,
      contactInfo: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json({ success: true, data: { company } });
});
