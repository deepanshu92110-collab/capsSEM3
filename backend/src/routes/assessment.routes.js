import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { getAssessment, getResult, listAssessments, myResults, submitAssessment } from "../controllers/assessment.controller.js";
const router = Router(); router.use(requireAuth);
router.get("/", listAssessments); router.get("/results/me", allowRoles("STUDENT"), myResults); router.get("/results/:id", allowRoles("STUDENT"), getResult);
router.get("/:id", getAssessment); router.post("/:id/submit", allowRoles("STUDENT"), submitAssessment); export default router;
