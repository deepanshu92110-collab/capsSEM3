import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { matchOpportunities, matchOpportunity } from "../controllers/matching.controller.js";
const router = Router(); router.use(requireAuth, allowRoles("STUDENT")); router.get("/opportunities", matchOpportunities); router.get("/opportunities/:id", matchOpportunity); export default router;
