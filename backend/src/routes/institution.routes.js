import { Router } from "express";
import {
  createInstitution,
  getOwnInstitution,
  updateInstitution,
  getInstitution,
  verifyInstitution,
  verifyCompany,
} from "../controllers/institution.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
const router = Router();
router.use(requireAuth);
router.post("/profile", allowRoles("INSTITUTION"), createInstitution);
router.get("/me", allowRoles("INSTITUTION"), getOwnInstitution);
router.patch("/profile", allowRoles("INSTITUTION"), updateInstitution);
router.get(
  "/:id",
  allowRoles("INSTITUTION", "STUDENT", "INDUSTRY", "ADMIN"),
  getInstitution,
);
router.patch("/:id/verify", allowRoles("ADMIN"), verifyInstitution);
router.patch("/companies/:id/verify", allowRoles("ADMIN"), verifyCompany);
export default router;
