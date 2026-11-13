import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { MAX_TEXT_LENGTHS, parseIsoDate, validateHttpUrl } from "../utils/industry.validation.js";
import { calculatePlacementRate, companyOwnsResource, hasSelectedCompanyApplication, isInterviewEligible, validateInternshipPeriod } from "../utils/person4.rules.js";
import { submitApplication } from "../services/person4.workflow.js";

const send = (res, data, status = 200) => res.status(status).json({ success: true, data });
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const companySafeSelect = { id: true, name: true, website: true, address: true };
const appInclude = { opportunity: { include: { company: { select: { id: true, userId: true, name: true } } } }, studentProfile: { select: { userId: true, institutionId: true, resumeUrl: true, user: { select: { fullName: true } }, skills: { select: { proficiencyLevel: true, skill: { select: { name: true } } } } } } };
const applicantInclude = { opportunity: { include: { company: { select: companySafeSelect } } }, studentProfile: { select: { resumeUrl: true, user: { select: { fullName: true } }, skills: { select: { proficiencyLevel: true, skill: { select: { name: true } } } } } } };
function validBody(body, allowed) { return body && typeof body === "object" && !Array.isArray(body) && Object.keys(body).every(key => allowed.includes(key)); }
function safeApplication(application, { includeApplicant = false, includeResume = false } = {}) {
  if (!application) return application;
  const { recruiterRemarks, ...result } = application;
  if (result.opportunity?.company) result.opportunity.company = { id: result.opportunity.company.id, name: result.opportunity.company.name, ...(result.opportunity.company.website ? { website: result.opportunity.company.website } : {}), ...(result.opportunity.company.address ? { address: result.opportunity.company.address } : {}) };
  if (!includeApplicant) delete result.studentProfile;
  else if (result.studentProfile) {
    const profile = result.studentProfile;
    result.studentProfile = { user: { fullName: profile.user.fullName }, skills: profile.skills };
    if (includeResume && profile.resumeUrl) result.studentProfile.resumeUrl = profile.resumeUrl;
  }
  return result;
}
async function student(req) { return prisma.studentProfile.findUnique({ where: { userId: req.user.id } }); }
async function company(req) { return prisma.company.findUnique({ where: { userId: req.user.id } }); }
async function ownedApp(req, res) {
  const application = await prisma.application.findUnique({ where: { id: req.params.id }, include: appInclude });
  if (!application) { bad(res, "Application not found", 404); return null; }
  if (req.user.role === "STUDENT" && application.studentProfile.userId !== req.user.id) { bad(res, "Application not found", 404); return null; }
  if (req.user.role === "INDUSTRY" && !companyOwnsResource(application.opportunity.companyId, (await company(req))?.id)) { bad(res, "Application not found", 404); return null; }
  return application;
}
async function notify(tx, userId, type, title, message, link) { await tx.notification.create({ data: { userId, type, title, message, link } }); }

export const apply = asyncHandler(async (req, res) => {
  if (!validBody(req.body, ["opportunityId", "coverLetter"])) return bad(res, "Request body must contain supported application fields");
  if (typeof req.body?.opportunityId !== "string") return bad(res, "opportunityId is required");
  if (req.body.coverLetter != null && (typeof req.body.coverLetter !== "string" || req.body.coverLetter.length > 10000)) return bad(res, "coverLetter must be at most 10000 characters");
  const profile = await student(req); if (!profile) return bad(res, "Student profile not found", 404);
  const opportunity = await prisma.opportunity.findUnique({ where: { id: req.body.opportunityId } });
  if (!opportunity || opportunity.status !== "OPEN" || (opportunity.applicationDeadline && opportunity.applicationDeadline <= new Date())) return bad(res, "Applications are only accepted for open opportunities before their deadline", 409);
  const result = await submitApplication({ prisma, profile, opportunity, userId: req.user.id, coverLetter: req.body.coverLetter?.trim() || null, include: appInclude });
  if (result.duplicate) return bad(res, "You have already applied to this opportunity", 409);
  send(res, { application: safeApplication(result.application) }, 201);
});

export const myApplications = asyncHandler(async (req, res) => { const p = await student(req); if (!p) return bad(res, "Student profile not found", 404); const applications = await prisma.application.findMany({ where: { studentProfileId: p.id }, include: { opportunity: { select: { id: true, title: true, type: true, status: true, applicationDeadline: true, company: { select: companySafeSelect } } }, history: { orderBy: { createdAt: "asc" }, select: { status: true, createdAt: true } } }, orderBy: { createdAt: "desc" } }); send(res, { applications: applications.map(a => safeApplication(a)) }); });
export const getApplication = asyncHandler(async (req, res) => { const a = await ownedApp(req, res); if (a) send(res, { application: safeApplication(a, { includeApplicant: req.user.role === "INDUSTRY", includeResume: req.user.role === "INDUSTRY" }) }); });
export const history = asyncHandler(async (req, res) => { const a = await ownedApp(req, res); if (a) send(res, { history: await prisma.applicationStatusHistory.findMany({ where: { applicationId: a.id }, orderBy: { createdAt: "asc" }, select: { id: true, status: true, remarks: req.user.role === "STUDENT" ? false : true, createdAt: true } }) }); });
export const withdraw = asyncHandler(async (req, res) => { const a = await ownedApp(req, res); if (!a) return; if (!(["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(a.status))) return bad(res, "This application can no longer be withdrawn", 409); const updated = await prisma.$transaction(async tx => { const u = await tx.application.update({ where: { id: a.id }, data: { status: "WITHDRAWN" } }); await tx.applicationStatusHistory.create({ data: { applicationId: a.id, status: "WITHDRAWN", changedByUserId: req.user.id } }); await notify(tx, a.opportunity.company.userId, "APPLICATION_WITHDRAWN", "Application withdrawn", "A candidate withdrew their application.", "/industry/applicants"); return u; }); send(res, { application: updated }); });
export const companyApplications = asyncHandler(async (req, res) => { const c = await company(req); if (!c) return bad(res, "Company profile not found", 404); const applications = await prisma.application.findMany({ where: { opportunity: { companyId: c.id } }, include: applicantInclude, orderBy: { createdAt: "desc" } }); send(res, { applications: applications.map(a => safeApplication(a, { includeApplicant: true, includeResume: true })) }); });
export const companyStats = asyncHandler(async (req, res) => { const c = await company(req); if (!c) return bad(res, "Company profile not found", 404); const rows = await prisma.application.groupBy({ by: ["status"], where: { opportunity: { companyId: c.id } }, _count: { _all: true } }); send(res, { stats: Object.fromEntries(rows.map(x => [x.status, x._count._all])), total: rows.reduce((n,x)=>n+x._count._all,0) }); });
export const updateApplicationStatus = asyncHandler(async (req, res) => { const a = await ownedApp(req, res); if (!a) return; const { status, remarks } = req.body || {}; const allowed = { SUBMITTED: ["UNDER_REVIEW", "SHORTLISTED", "REJECTED"], UNDER_REVIEW: ["SHORTLISTED", "REJECTED"], SHORTLISTED: ["SELECTED", "REJECTED"], SELECTED: [], REJECTED: [], WITHDRAWN: [] }; if (!allowed[a.status]?.includes(status)) return bad(res, `Cannot change status from ${a.status} to ${status}`, 409); if (remarks != null && (typeof remarks !== "string" || remarks.length > 2000)) return bad(res, "remarks must be at most 2000 characters"); const result = await prisma.$transaction(async tx => { const u = await tx.application.update({ where: { id: a.id }, data: { status, recruiterRemarks: remarks?.trim() || null } }); await tx.applicationStatusHistory.create({ data: { applicationId: a.id, status, remarks: remarks?.trim() || null, changedByUserId: req.user.id } }); await notify(tx, a.studentProfile.userId, "APPLICATION_STATUS", "Application status updated", `Your application is now ${status.toLowerCase().replaceAll("_", " ")}.`, `/applications/${a.id}`); return u; }); send(res, { application: result }); });

export const createInterview = asyncHandler(async (req, res) => {
  if (!validBody(req.body, ["applicationId", "scheduledAt", "location", "meetingUrl", "notes"])) return bad(res, "Request body must contain supported interview fields");
  if (typeof req.body.applicationId !== "string") return bad(res, "applicationId is required");
  const scheduledAt = parseIsoDate(req.body.scheduledAt);
  if (!scheduledAt || scheduledAt <= new Date()) return bad(res, "scheduledAt must be a future ISO 8601 timestamp with timezone");
  if (req.body.location != null && (typeof req.body.location !== "string" || req.body.location.trim().length > 500)) return bad(res, "location must be a string up to 500 characters");
  if (req.body.meetingUrl != null && req.body.meetingUrl !== "" && !validateHttpUrl(req.body.meetingUrl)) return bad(res, "meetingUrl must be a valid HTTP or HTTPS URL");
  if (req.body.notes != null && (typeof req.body.notes !== "string" || req.body.notes.length > 2000)) return bad(res, "notes must be a string up to 2000 characters");
  const a = await prisma.application.findUnique({ where: { id: req.body.applicationId }, include: appInclude });
  if (!a) return bad(res, "Application not found", 404);
  if (!companyOwnsResource(a.opportunity.companyId, (await company(req))?.id)) return bad(res, "Application not found", 404);
  if (!isInterviewEligible(a.status)) return bad(res, "Interviews can only be scheduled for shortlisted or selected candidates", 409);
  const interview = await prisma.$transaction(async tx => {
    const created = await tx.interview.create({ data: { applicationId: a.id, scheduledAt, location: req.body.location?.trim() || null, meetingUrl: req.body.meetingUrl?.trim() || null, notes: req.body.notes?.trim() || null } });
    await notify(tx, a.studentProfile.userId, "INTERVIEW_SCHEDULED", "Interview scheduled", `An interview is scheduled for ${scheduledAt.toLocaleString()}.`, "/interviews");
    return created;
  });
  send(res, { interview }, 201);
});
export const myInterviews = asyncHandler(async(req,res)=>{const p=await student(req); if(!p)return bad(res,"Student profile not found",404); send(res,{interviews:await prisma.interview.findMany({where:{application:{studentProfileId:p.id}},include:{application:{select:{id:true,opportunity:{select:{id:true,title:true}}}}},orderBy:{scheduledAt:"asc"}})});});
export const companyInterviews = asyncHandler(async(req,res)=>{const c=await company(req); if(!c)return bad(res,"Company profile not found",404); const interviews=await prisma.interview.findMany({where:{application:{opportunity:{companyId:c.id}}},include:{application:{select:{id:true,status:true,opportunity:{select:{id:true,title:true}},studentProfile:{select:{user:{select:{fullName:true}}}}}}},orderBy:{scheduledAt:"asc"}}); send(res,{interviews});});
export const updateInterview = asyncHandler(async (req, res) => {
  const allowed = ["scheduledAt", "location", "meetingUrl", "notes"];
  if (!validBody(req.body, allowed) || Object.keys(req.body).length === 0) return bad(res, "Provide valid interview fields to update");
  const i = await prisma.interview.findUnique({ where: { id: req.params.id }, include: { application: { include: appInclude } } });
  if (!i) return bad(res, "Interview not found", 404);
  if (i.application.opportunity.companyId !== (await company(req))?.id) return bad(res, "Interview not found", 404);
  if (i.status !== "SCHEDULED") return bad(res, "Only scheduled interviews can be changed", 409);
  const data = {};
  if (req.body.scheduledAt !== undefined) {
    const scheduledAt = parseIsoDate(req.body.scheduledAt);
    if (!scheduledAt || scheduledAt <= new Date()) return bad(res, "scheduledAt must be a future ISO 8601 timestamp with timezone");
    data.scheduledAt = scheduledAt;
  }
  if (req.body.location !== undefined) {
    if (req.body.location !== null && (typeof req.body.location !== "string" || req.body.location.trim().length > 500)) return bad(res, "location must be a string up to 500 characters or null");
    data.location = req.body.location?.trim() || null;
  }
  if (req.body.meetingUrl !== undefined) {
    if (req.body.meetingUrl !== null && req.body.meetingUrl !== "" && !validateHttpUrl(req.body.meetingUrl)) return bad(res, "meetingUrl must be a valid HTTP or HTTPS URL");
    data.meetingUrl = req.body.meetingUrl?.trim() || null;
  }
  if (req.body.notes !== undefined) {
    if (req.body.notes !== null && (typeof req.body.notes !== "string" || req.body.notes.length > 2000)) return bad(res, "notes must be a string up to 2000 characters or null");
    data.notes = req.body.notes?.trim() || null;
  }
  const updated = await prisma.$transaction(async tx => {
    const record = await tx.interview.update({ where: { id: i.id }, data });
    await notify(tx, i.application.studentProfile.userId, "INTERVIEW_RESCHEDULED", "Interview updated", "Your interview details have changed.", "/interviews");
    return record;
  });
  send(res, { interview: updated });
});
export const cancelInterview = asyncHandler(async(req,res)=>{const i=await prisma.interview.findUnique({where:{id:req.params.id},include:{application:{include:appInclude}}});if(!i)return bad(res,"Interview not found",404);if(i.application.opportunity.companyId!==(await company(req))?.id)return bad(res,"Interview not found",404);if(i.status!=="SCHEDULED")return bad(res,"Only scheduled interviews can be cancelled",409);const u=await prisma.$transaction(async tx=>{const r=await tx.interview.update({where:{id:i.id},data:{status:"CANCELLED"}});await notify(tx,i.application.studentProfile.userId,"INTERVIEW_CANCELLED","Interview cancelled","Your interview was cancelled.","/interviews");return r;});send(res,{interview:u});});

export const createInternship = asyncHandler(async (req, res) => {
  if (!validBody(req.body, ["applicationId", "title", "startDate", "endDate", "notes"])) return bad(res, "Request body must contain supported internship fields");
  if (typeof req.body.applicationId !== "string") return bad(res, "applicationId is required");
  if (req.body.title != null && (typeof req.body.title !== "string" || !req.body.title.trim() || req.body.title.trim().length > MAX_TEXT_LENGTHS.title)) return bad(res, `title must be a non-empty string up to ${MAX_TEXT_LENGTHS.title} characters`);
  const period = validateInternshipPeriod(req.body.startDate, req.body.endDate);
  if (period.error) return bad(res, period.error);
  if (req.body.notes != null && (typeof req.body.notes !== "string" || req.body.notes.length > 2000)) return bad(res, "notes must be a string up to 2000 characters");
  const a = await prisma.application.findUnique({ where: { id: req.body.applicationId }, include: appInclude });
  if (!a) return bad(res, "Application not found", 404);
  if (!companyOwnsResource(a.opportunity.companyId, (await company(req))?.id)) return bad(res, "Application not found", 404);
  if (a.status !== "SELECTED") return bad(res, "Only selected candidates can receive internships", 409);
  const internship = await prisma.$transaction(async tx => {
    const created = await tx.internship.create({ data: { applicationId: a.id, studentProfileId: a.studentProfileId, companyId: a.opportunity.companyId, institutionId: a.studentProfile.institutionId, title: req.body.title?.trim() || a.opportunity.title, startDate: period.startDate, endDate: period.endDate, notes: req.body.notes?.trim() || null } });
    await notify(tx, a.studentProfile.userId, "INTERNSHIP_OFFERED", "Internship offered", `You received an internship offer for ${created.title}.`, "/internships");
    return created;
  });
  send(res, { internship }, 201);
});
export const myInternships=asyncHandler(async(req,res)=>{const p=await student(req);if(!p)return bad(res,"Student profile not found",404);send(res,{internships:await prisma.internship.findMany({where:{studentProfileId:p.id},select:{id:true,title:true,status:true,company:{select:{name:true}}},orderBy:{createdAt:"desc"}})});});
export const companyInternships=asyncHandler(async(req,res)=>{const c=await company(req);if(!c)return bad(res,"Company profile not found",404);send(res,{internships:await prisma.internship.findMany({where:{companyId:c.id},select:{id:true,title:true,status:true,studentProfile:{select:{user:{select:{fullName:true}}}}},orderBy:{createdAt:"desc"}})});});
export const institutionInternships=asyncHandler(async(req,res)=>{const i=await prisma.institution.findUnique({where:{userId:req.user.id}});if(!i)return bad(res,"Institution profile not found",404);send(res,{internships:await prisma.internship.findMany({where:{institutionId:i.id},select:{id:true,title:true,status:true,company:{select:{name:true}},studentProfile:{select:{user:{select:{fullName:true}}}}},orderBy:{createdAt:"desc"}})});});
export const institutionStudents = asyncHandler(async (req, res) => {
  const institution = await prisma.institution.findUnique({ where: { userId: req.user.id }, select: { id: true } });
  if (!institution) return bad(res, "Institution profile not found", 404);
  const students = await prisma.studentProfile.findMany({ where: { institutionId: institution.id }, select: { degree: true, department: true, graduationYear: true, semester: true, user: { select: { fullName: true, email: true } }, _count: { select: { assessmentResults: true } } }, orderBy: { user: { fullName: "asc" } } });
  send(res, { students });
});
export const updateInternship = asyncHandler(async (req, res) => {
  if (!validBody(req.body, ["status"]) || typeof req.body.status !== "string") return bad(res, "status is required");
  const internship = await prisma.internship.findUnique({ where: { id: req.params.id } });
  if (!internship) return bad(res, "Internship not found", 404);
  const owned = req.user.role === "INDUSTRY" ? (await company(req))?.id === internship.companyId : req.user.role === "INSTITUTION" ? (await prisma.institution.findUnique({ where: { userId: req.user.id } }))?.id === internship.institutionId : false;
  if (!owned && req.user.role !== "ADMIN") return bad(res, "Internship not found", 404);
  const transitions = { OFFERED: ["ACTIVE", "CANCELLED"], ACTIVE: ["COMPLETED", "CANCELLED"], COMPLETED: [], CANCELLED: [] };
  if (!transitions[internship.status]?.includes(req.body.status)) return bad(res, `Cannot change internship status from ${internship.status} to ${req.body.status}`, 409);
  const updated = await prisma.$transaction(async tx => {
    const record = await tx.internship.update({ where: { id: internship.id }, data: { status: req.body.status } });
    const profile = await tx.studentProfile.findUnique({ where: { id: internship.studentProfileId }, select: { userId: true } });
    await notify(tx, profile.userId, "INTERNSHIP_UPDATED", "Internship updated", `Internship status is ${record.status.toLowerCase()}.`, "/internships");
    return record;
  });
  send(res, { internship: updated });
});

export const createPlacement = asyncHandler(async (req, res) => {
  const fields = ["studentProfileId", "companyId", "role", "compensation", "notes"];
  if (!validBody(req.body, fields)) return bad(res, "Request body must contain supported placement fields");
  const { studentProfileId, companyId, role, compensation, notes } = req.body;
  if (typeof studentProfileId !== "string" || typeof companyId !== "string" || typeof role !== "string" || !role.trim() || role.trim().length > MAX_TEXT_LENGTHS.title) return bad(res, "studentProfileId, companyId and a role up to 200 characters are required");
  if (compensation != null && (typeof compensation !== "string" || compensation.length > 200)) return bad(res, "compensation must be a string up to 200 characters");
  if (notes != null && (typeof notes !== "string" || notes.length > 2000)) return bad(res, "notes must be a string up to 2000 characters");
  const profile = await prisma.studentProfile.findUnique({ where: { id: studentProfileId }, select: { id: true, userId: true, institutionId: true } });
  if (!profile) return bad(res, "Student not found", 404);
  if (req.user.role === "INDUSTRY") {
    const ownedCompany = await company(req);
    if (!companyOwnsResource(companyId, ownedCompany?.id)) return bad(res, "Company ownership mismatch", 403);
    if (!await hasSelectedCompanyApplication(prisma, studentProfileId, companyId)) return bad(res, "A placement can only be recorded for a candidate selected through your company's opportunity", 403);
  }
  if (req.user.role === "INSTITUTION") {
    const institution = await prisma.institution.findUnique({ where: { userId: req.user.id } });
    if (!institution || profile.institutionId !== institution.id) return bad(res, "Student does not belong to your institution", 403);
  }
  const companyRecord = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
  if (!companyRecord) return bad(res, "Company not found", 404);
  const placement = await prisma.$transaction(async tx => {
    const created = await tx.placement.create({ data: { studentProfileId, institutionId: profile.institutionId, companyId, role: role.trim(), compensation: compensation?.trim() || null, notes: notes?.trim() || null } });
    await notify(tx, profile.userId, "PLACEMENT_RECORDED", "Placement recorded", `Your placement as ${role.trim()} was recorded.`, "/placements");
    return created;
  });
  send(res, { placement }, 201);
});
export const myPlacements=asyncHandler(async(req,res)=>{const p=await student(req);if(!p)return bad(res,"Student profile not found",404);send(res,{placements:await prisma.placement.findMany({where:{studentProfileId:p.id},select:{id:true,role:true,placedAt:true,company:{select:{name:true}}},orderBy:{placedAt:"desc"}})});});
export const institutionPlacements=asyncHandler(async(req,res)=>{const i=await prisma.institution.findUnique({where:{userId:req.user.id}});if(!i)return bad(res,"Institution profile not found",404);send(res,{placements:await prisma.placement.findMany({where:{institutionId:i.id},select:{id:true,role:true,placedAt:true,company:{select:{name:true}},studentProfile:{select:{user:{select:{fullName:true}}}}},orderBy:{placedAt:"desc"}})});});
export const adminPlacements=asyncHandler(async(req,res)=>send(res,{placements:await prisma.placement.findMany({select:{id:true,role:true,placedAt:true,company:{select:{name:true}},institution:{select:{name:true}},studentProfile:{select:{user:{select:{fullName:true}}}}},orderBy:{placedAt:"desc"}})}));
export const updatePlacement = asyncHandler(async (req, res) => {
  if (!validBody(req.body, ["role", "compensation", "notes"]) || Object.keys(req.body).length === 0) return bad(res, "Provide valid placement fields to update");
  const placement = await prisma.placement.findUnique({ where: { id: req.params.id } });
  if (!placement) return bad(res, "Placement not found", 404);
  if (req.user.role === "INSTITUTION") {
    const institution = await prisma.institution.findUnique({ where: { userId: req.user.id } });
    if (institution?.id !== placement.institutionId) return bad(res, "Placement not found", 404);
  }
  const data = {};
  if (req.body.role !== undefined) {
    if (typeof req.body.role !== "string" || !req.body.role.trim() || req.body.role.trim().length > MAX_TEXT_LENGTHS.title) return bad(res, "role must be a non-empty string up to 200 characters");
    data.role = req.body.role.trim();
  }
  if (req.body.compensation !== undefined) {
    if (req.body.compensation !== null && (typeof req.body.compensation !== "string" || req.body.compensation.length > 200)) return bad(res, "compensation must be a string up to 200 characters or null");
    data.compensation = req.body.compensation?.trim() || null;
  }
  if (req.body.notes !== undefined) {
    if (req.body.notes !== null && (typeof req.body.notes !== "string" || req.body.notes.length > 2000)) return bad(res, "notes must be a string up to 2000 characters or null");
    data.notes = req.body.notes?.trim() || null;
  }
  const updated = await prisma.$transaction(async tx => {
    const record = await tx.placement.update({ where: { id: placement.id }, data });
    const profile = await tx.studentProfile.findUnique({ where: { id: placement.studentProfileId }, select: { userId: true } });
    await notify(tx, profile.userId, "PLACEMENT_UPDATED", "Placement updated", "Your placement record was updated.", "/placements");
    return record;
  });
  send(res, { placement: updated });
});

export const notifications=asyncHandler(async(req,res)=>send(res,{notifications:await prisma.notification.findMany({where:{userId:req.user.id},orderBy:{createdAt:"desc"},take:100})}));
export const unreadCount=asyncHandler(async(req,res)=>send(res,{count:await prisma.notification.count({where:{userId:req.user.id,readAt:null}})}));
export const markRead=asyncHandler(async(req,res)=>{const n=await prisma.notification.findUnique({where:{id:req.params.id}});if(!n||n.userId!==req.user.id)return bad(res,"Notification not found",404);send(res,{notification:await prisma.notification.update({where:{id:n.id},data:{readAt:n.readAt||new Date()}})});});
export const markAllRead=asyncHandler(async(req,res)=>{const result=await prisma.notification.updateMany({where:{userId:req.user.id,readAt:null},data:{readAt:new Date()}});send(res,{updated:result.count});});
export const deleteNotification=asyncHandler(async(req,res)=>{const result=await prisma.notification.deleteMany({where:{id:req.params.id,userId:req.user.id}});if(!result.count)return bad(res,"Notification not found",404);send(res,{deleted:true});});

export const dashboardStudent=asyncHandler(async(req,res)=>{const p=await student(req);if(!p)return bad(res,"Student profile not found",404);const now=new Date();const [applications,interviews,internships,placements,notifications]=await Promise.all([prisma.application.groupBy({by:["status"],where:{studentProfileId:p.id},_count:{_all:true}}),prisma.interview.count({where:{application:{studentProfileId:p.id},status:"SCHEDULED",scheduledAt:{gt:now}}}),prisma.internship.count({where:{studentProfileId:p.id}}),prisma.placement.count({where:{studentProfileId:p.id}}),prisma.notification.count({where:{userId:req.user.id,readAt:null}})]);send(res,{applications:Object.fromEntries(applications.map(a=>[a.status,a._count._all])),upcomingInterviews:interviews,internships,placements,unreadNotifications:notifications});});
export const dashboardIndustry=asyncHandler(async(req,res)=>{const c=await company(req);if(!c)return bad(res,"Company profile not found",404);const since=new Date(Date.now()-7*24*60*60*1000);const [opportunities,applications,interviews,internships,newApplications]=await Promise.all([prisma.opportunity.groupBy({by:["status"],where:{companyId:c.id},_count:{_all:true}}),prisma.application.groupBy({by:["status"],where:{opportunity:{companyId:c.id}},_count:{_all:true}}),prisma.interview.count({where:{application:{opportunity:{companyId:c.id}},status:"SCHEDULED"}}),prisma.internship.count({where:{companyId:c.id}}),prisma.application.count({where:{opportunity:{companyId:c.id},createdAt:{gte:since}}})]);send(res,{opportunities:Object.fromEntries(opportunities.map(x=>[x.status,x._count._all])),applications:Object.fromEntries(applications.map(x=>[x.status,x._count._all])),newApplications,interviews,internships});});
export const dashboardInstitution=asyncHandler(async(req,res)=>{const i=await prisma.institution.findUnique({where:{userId:req.user.id}});if(!i)return bad(res,"Institution profile not found",404);const [students,placements,placedStudents,activeInternships,placementRows]=await Promise.all([prisma.studentProfile.count({where:{institutionId:i.id}}),prisma.placement.count({where:{institutionId:i.id}}),prisma.placement.groupBy({by:["studentProfileId"],where:{institutionId:i.id}}),prisma.internship.count({where:{institutionId:i.id,status:"ACTIVE"}}),prisma.placement.findMany({where:{institutionId:i.id},select:{studentProfile:{select:{department:true}},company:{select:{id:true,name:true}}}})]);const departments={};const companies={};for(const row of placementRows){const dept=row.studentProfile.department||"Unspecified";departments[dept]=(departments[dept]||0)+1;const companyName=row.company.name;companies[companyName]=(companies[companyName]||0)+1;}send(res,{students,placements,placementRate:students?placedStudents.length/students:0,activeInternships,departmentPlacements:departments,topHiringCompanies:Object.entries(companies).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}))});});
export const dashboardAdmin=asyncHandler(async(req,res)=>{const [users,students,institutions,industries,companies,opportunities,applications,internships,placements,placedStudents]=await Promise.all([prisma.user.count(),prisma.user.count({where:{role:"STUDENT"}}),prisma.user.count({where:{role:"INSTITUTION"}}),prisma.user.count({where:{role:"INDUSTRY"}}),prisma.company.count({where:{isVerified:true}}),prisma.opportunity.count(),prisma.application.count(),prisma.internship.count(),prisma.placement.count(),prisma.placement.groupBy({by:["studentProfileId"]})]);send(res,{users,students,institutions,industries,verifiedCompanies:companies,opportunities,applications,internships,placements,placementRate:calculatePlacementRate(students,placedStudents)});});
