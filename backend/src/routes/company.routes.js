import { Router } from "express";
import { getOwnCompany, updateOwnCompany } from "../controllers/company.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = Router();
router.use(requireAuth, allowRoles("INDUSTRY"));
router.get("/me", getOwnCompany);
router.patch("/profile", updateOwnCompany);
export default router;
