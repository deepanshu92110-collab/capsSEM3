import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { gapMe, gapOpportunity } from "../controllers/skillGap.controller.js";
const router = Router(); router.use(requireAuth, allowRoles("STUDENT")); router.get("/me", gapMe); router.get("/opportunity/:opportunityId", gapOpportunity); export default router;
