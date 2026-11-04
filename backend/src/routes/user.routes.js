import { Router } from "express";
import {
  listUsers,
  getUser,
  updateUser,
  setUserStatus,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
const router = Router();
router.use(requireAuth);
router.get("/", allowRoles("ADMIN"), listUsers);
router.get("/:id", allowRoles("ADMIN"), getUser);
router.patch("/:id", updateUser);
router.patch("/:id/status", allowRoles("ADMIN"), setUserStatus);
export default router;
