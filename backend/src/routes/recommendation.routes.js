import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { completeRecommendation, listRecommendations, refreshRecommendations } from "../controllers/recommendation.controller.js";
const router = Router(); router.use(requireAuth, allowRoles("STUDENT")); router.get("/me", listRecommendations); router.post("/refresh", refreshRecommendations); router.patch("/:id/complete", completeRecommendation); export default router;
