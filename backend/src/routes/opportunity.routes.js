import { Router } from "express";
import {
  browseOpportunities,
  createOpportunity,
  deleteOpportunity,
  getOpportunity,
  listMyOpportunities,
  setOpportunityStatus,
  updateOpportunity,
} from "../controllers/opportunity.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = Router();
router.use(requireAuth);
router.get("/mine", allowRoles("INDUSTRY"), listMyOpportunities);
router.get("/", allowRoles("STUDENT", "INSTITUTION", "INDUSTRY", "ADMIN"), browseOpportunities);
router.post("/", allowRoles("INDUSTRY"), createOpportunity);
router.get("/:id", allowRoles("STUDENT", "INSTITUTION", "INDUSTRY", "ADMIN"), getOpportunity);
router.patch("/:id", allowRoles("INDUSTRY"), updateOpportunity);
router.patch("/:id/status", allowRoles("INDUSTRY"), setOpportunityStatus);
router.delete("/:id", allowRoles("INDUSTRY"), deleteOpportunity);
export default router;
