import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import {
  getOwnStudent,
  createStudent,
  updateStudent,
  getStudent,
  uploadStudentFile,
} from "../controllers/student.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
const router = Router();
const directory = path.resolve("uploads");
mkdirSync(directory, { recursive: true });
const storage = multer.diskStorage({
  destination: directory,
  filename: (req, file, cb) =>
    cb(
      null,
      `${req.user.id}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`,
    ),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed =
      (file.mimetype === "application/pdf" && ext === ".pdf") ||
      (file.mimetype.startsWith("image/") &&
        [".png", ".jpg", ".jpeg", ".webp"].includes(ext));
    cb(
      allowed
        ? null
        : new Error(
            "Only PDF resumes and PNG/JPG/WebP profile images are allowed",
          ),
      allowed,
    );
  },
});
router.use(requireAuth);
router.get("/me", allowRoles("STUDENT"), getOwnStudent);
router.post("/profile", allowRoles("STUDENT"), createStudent);
router.patch("/profile", allowRoles("STUDENT"), updateStudent);
router.post(
  "/profile/resume",
  allowRoles("STUDENT"),
  upload.single("file"),
  uploadStudentFile,
);
router.patch(
  "/profile/image",
  allowRoles("STUDENT"),
  upload.single("file"),
  uploadStudentFile,
);
router.get(
  "/:id",
  allowRoles("STUDENT", "INSTITUTION", "INDUSTRY", "ADMIN"),
  getStudent,
);
export default router;
