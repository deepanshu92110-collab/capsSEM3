import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import studentRoutes from "./routes/student.routes.js";
import institutionRoutes from "./routes/institution.routes.js";
import companyRoutes from "./routes/company.routes.js";
import opportunityRoutes from "./routes/opportunity.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import skillGapRoutes from "./routes/skillGap.routes.js";
import matchingRoutes from "./routes/matching.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve("uploads")));
app.get("/api/health", (req, res) =>
  res.json({ success: true, data: { status: "ok" } }),
);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/skill-gap", skillGapRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
