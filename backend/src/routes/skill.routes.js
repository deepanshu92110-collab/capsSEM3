import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { addMySkill, createSkill, deleteMySkill, getSkill, listSkills, mySkills, updateMySkill } from "../controllers/skill.controller.js";
const router = Router(); router.use(requireAuth);
router.get("/", listSkills); router.get("/me", allowRoles("STUDENT"), mySkills);
router.post("/", allowRoles("ADMIN"), createSkill); router.post("/me", allowRoles("STUDENT"), addMySkill);
router.patch("/me/:skillId", allowRoles("STUDENT"), updateMySkill); router.delete("/me/:skillId", allowRoles("STUDENT"), deleteMySkill);
router.get("/:id", getSkill); export default router;
