import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { approveResumeSkills, extractResumeSkills } from "../controllers/resume.controller.js";
const router = Router(); router.use(requireAuth, allowRoles("STUDENT")); router.post("/extract-skills", extractResumeSkills); router.post("/approve-skills", approveResumeSkills); export default router;
