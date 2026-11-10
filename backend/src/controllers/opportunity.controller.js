import { OpportunityStatus, OpportunityType, WorkMode } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  isAllowedOpportunityTransition,
  isFutureDate,
  MAX_TEXT_LENGTHS,
  parseIsoDate,
  parsePagination,
  publicOpportunityStatus,
  validateHttpUrl,
} from "../utils/industry.validation.js";

const types = Object.values(OpportunityType);
const statuses = Object.values(OpportunityStatus);
const workModes = Object.values(WorkMode);
const editableFields = [
  "title", "type", "description", "responsibilities", "qualifications",
  "location", "workMode", "compensation", "openings", "applicationUrl",
  "applicationDeadline", "startDate", "endDate",
];
const dateFields = ["applicationDeadline", "startDate", "endDate"];
const textFieldLimits = {
  title: MAX_TEXT_LENGTHS.title,
  description: MAX_TEXT_LENGTHS.description,
  responsibilities: MAX_TEXT_LENGTHS.responsibilities,
  qualifications: MAX_TEXT_LENGTHS.qualifications,
  location: MAX_TEXT_LENGTHS.location,
  compensation: MAX_TEXT_LENGTHS.compensation,
  applicationUrl: MAX_TEXT_LENGTHS.applicationUrl,
};
const companySummary = { select: { id: true, name: true, website: true, address: true, isVerified: true } };
const include = { company: companySummary };

function fail(res, message) {
  return res.status(400).json({ success: false, message });
}

function parseOpportunity(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return { error: "Request body must be a JSON object" };
  const unknown = Object.keys(body).filter((key) => !editableFields.includes(key));
  if (unknown.length) return { error: `Unsupported opportunity field: ${unknown[0]}` };
  const data = {};
  for (const key of editableFields) {
    if (body[key] === undefined) continue;
    const value = body[key];
    if (["title", "description"].includes(key)) {
      if (typeof value !== "string" || !value.trim()) return { error: `${key} is required and must be a non-empty string` };
      if (value.trim().length > textFieldLimits[key]) return { error: `${key} must be at most ${textFieldLimits[key]} characters` };
      data[key] = value.trim();
    } else if (["responsibilities", "qualifications", "location", "compensation", "applicationUrl"].includes(key)) {
      if (value !== null && typeof value !== "string") return { error: `${key} must be a string or null` };
      if (typeof value === "string" && value.trim().length > textFieldLimits[key]) return { error: `${key} must be at most ${textFieldLimits[key]} characters` };
      data[key] = typeof value === "string" ? value.trim() || null : null;
      if (key === "applicationUrl" && data[key] && !validateHttpUrl(data[key]))
        return { error: "applicationUrl must be a valid HTTP or HTTPS URL" };
    } else if (key === "type") {
      if (!types.includes(value)) return { error: `type must be one of: ${types.join(", ")}` };
      data[key] = value;
    } else if (key === "workMode") {
      if (value !== null && !workModes.includes(value)) return { error: `workMode must be one of: ${workModes.join(", ")}, or null` };
      data[key] = value;
    } else if (key === "openings") {
      if (!Number.isInteger(value) || value < 1 || value > 10000) return { error: "openings must be an integer between 1 and 10000" };
      data[key] = value;
    } else if (dateFields.includes(key)) {
      if (value === null || value === "") data[key] = null;
      else {
        const parsed = parseIsoDate(value);
        if (!parsed) return { error: `${key} must be a valid ISO 8601 timestamp with a timezone, or null` };
        if (key === "applicationDeadline" && !isFutureDate(parsed))
          return { error: "applicationDeadline must be in the future" };
        data[key] = parsed;
      }
    }
  }
  if (!partial) {
    for (const field of ["title", "type", "description"])
      if (data[field] === undefined) return { error: `${field} is required` };
  } else if (!Object.keys(data).length) return { error: "Provide at least one opportunity field" };
  const start = data.startDate;
  const end = data.endDate;
  if (start && end && end < start) return { error: "endDate must be on or after startDate" };
  return { data };
}

async function getOwnedCompany(req, res) {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
  if (!company) res.status(404).json({ success: false, message: "Company profile not found" });
  return company;
}

async function getOwnedOpportunity(req, res, company) {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opportunity) {
    res.status(404).json({ success: false, message: "Opportunity not found" });
    return null;
  }
  if (opportunity.companyId !== company.id) {
    res.status(403).json({ success: false, message: "You may only manage your own company opportunities" });
    return null;
  }
  return opportunity;
}

export const createOpportunity = asyncHandler(async (req, res) => {
  const { data, error } = parseOpportunity(req.body);
  if (error) return fail(res, error);
  const company = await getOwnedCompany(req, res);
  if (!company) return;
  const opportunity = await prisma.opportunity.create({ data: { ...data, companyId: company.id }, include });
  res.status(201).json({ success: true, data: { opportunity } });
});

export const listMyOpportunities = asyncHandler(async (req, res) => {
  const company = await getOwnedCompany(req, res);
  if (!company) return;
  const result = await listOpportunities(req, { companyId: company.id, includeAllStatuses: true });
  res.json({ success: true, data: result });
});

async function listOpportunities(req, options = {}) {
  const pagination = parsePagination(req.query);
  if (pagination.error) throw Object.assign(new Error(pagination.error), { status: 400 });
  const { page, pageSize } = pagination;
  const where = {};
  if (options.companyId) where.companyId = options.companyId;
  else if (!options.includeAllStatuses) where.status = OpportunityStatus.OPEN;
  if (req.query.status !== undefined) {
    if (!options.includeAllStatuses) {
      const publicStatus = publicOpportunityStatus(req.query.status);
      if (publicStatus.error) throw Object.assign(new Error(publicStatus.error), { status: 400 });
      where.status = publicStatus.status;
    } else if (!statuses.includes(req.query.status)) {
      throw Object.assign(new Error(`status must be one of: ${statuses.join(", ")}`), { status: 400 });
    } else where.status = req.query.status;
  }
  if (req.query.type !== undefined) {
    if (!types.includes(req.query.type)) throw Object.assign(new Error(`type must be one of: ${types.join(", ")}`), { status: 400 });
    where.type = req.query.type;
  }
  if (req.query.workMode !== undefined) {
    if (!workModes.includes(req.query.workMode)) throw Object.assign(new Error(`workMode must be one of: ${workModes.join(", ")}`), { status: 400 });
    where.workMode = req.query.workMode;
  }
  if (req.query.location) {
    const location = String(req.query.location).trim();
    if (location.length > MAX_TEXT_LENGTHS.location)
      throw Object.assign(new Error(`location must be at most ${MAX_TEXT_LENGTHS.location} characters`), { status: 400 });
    where.location = { contains: location, mode: "insensitive" };
  }
  if (req.query.search) {
    const search = String(req.query.search).trim();
    if (search.length > 100) throw Object.assign(new Error("search must be at most 100 characters"), { status: 400 });
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { company: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (req.query.sort !== undefined && !["deadline", "newest"].includes(req.query.sort))
    throw Object.assign(new Error("sort must be either deadline or newest"), { status: 400 });
  const orderBy = req.query.sort === "deadline" ? { applicationDeadline: "asc" } : { createdAt: "desc" };
  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({ where, include, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.opportunity.count({ where }),
  ]);
  return { opportunities, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export const browseOpportunities = asyncHandler(async (req, res) => {
  const result = await listOpportunities(req);
  res.json({ success: true, data: result });
});

export const getOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.id }, include });
  if (!opportunity) return res.status(404).json({ success: false, message: "Opportunity not found" });
  const canSeeDraft = req.user.role === "ADMIN" || (req.user.role === "INDUSTRY" && (await prisma.company.findUnique({ where: { userId: req.user.id }, select: { id: true } }))?.id === opportunity.companyId);
  if (opportunity.status !== OpportunityStatus.OPEN && !canSeeDraft)
    return res.status(404).json({ success: false, message: "Opportunity not found" });
  res.json({ success: true, data: { opportunity } });
});

export const updateOpportunity = asyncHandler(async (req, res) => {
  const { data, error } = parseOpportunity(req.body, { partial: true });
  if (error) return fail(res, error);
  const company = await getOwnedCompany(req, res);
  if (!company) return;
  const current = await getOwnedOpportunity(req, res, company);
  if (!current) return;
  const start = data.startDate === undefined ? current.startDate : data.startDate;
  const end = data.endDate === undefined ? current.endDate : data.endDate;
  if (start && end && end < start) return fail(res, "endDate must be on or after startDate");
  if (current.status === OpportunityStatus.ARCHIVED) return res.status(409).json({ success: false, message: "Archived opportunities cannot be edited" });
  const deadline = data.applicationDeadline === undefined ? current.applicationDeadline : data.applicationDeadline;
  if (deadline && !isFutureDate(deadline)) return fail(res, "applicationDeadline must be in the future");
  const opportunity = await prisma.opportunity.update({ where: { id: current.id }, data, include });
  res.json({ success: true, data: { opportunity } });
});

export const setOpportunityStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!statuses.includes(status)) return fail(res, `status must be one of: ${statuses.join(", ")}`);
  const company = await getOwnedCompany(req, res);
  if (!company) return;
  const current = await getOwnedOpportunity(req, res, company);
  if (!current) return;
  if (status === current.status) return res.json({ success: true, data: { opportunity: current } });
  if (current.status === OpportunityStatus.ARCHIVED)
    return res.status(409).json({ success: false, message: "Archived opportunities cannot change status" });
  if (!isAllowedOpportunityTransition(current.status, status))
    return res.status(409).json({ success: false, message: `Cannot change opportunity status from ${current.status} to ${status}` });
  if (status === OpportunityStatus.OPEN && current.applicationDeadline && !isFutureDate(current.applicationDeadline))
    return fail(res, "An expired opportunity cannot be published");
  const companyRecord = status === OpportunityStatus.OPEN
    ? await prisma.company.findUnique({ where: { id: company.id }, select: { isVerified: true } })
    : null;
  if (status === OpportunityStatus.OPEN && !companyRecord.isVerified)
    return res.status(403).json({ success: false, message: "Company verification is required before publishing opportunities" });
  const opportunity = await prisma.opportunity.update({
    where: { id: current.id },
    data: { status, ...(status === OpportunityStatus.OPEN ? { publishedAt: current.publishedAt || new Date() } : {}) },
    include,
  });
  res.json({ success: true, data: { opportunity } });
});

export const deleteOpportunity = asyncHandler(async (req, res) => {
  const company = await getOwnedCompany(req, res);
  if (!company) return;
  const current = await getOwnedOpportunity(req, res, company);
  if (!current) return;
  if (current.status !== OpportunityStatus.DRAFT)
    return res.status(409).json({ success: false, message: "Only draft opportunities can be deleted; close or archive published opportunities" });
  await prisma.opportunity.delete({ where: { id: current.id } });
  res.json({ success: true, message: "Opportunity deleted" });
});
