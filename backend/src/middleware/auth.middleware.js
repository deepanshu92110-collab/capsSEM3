import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null);
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res
      .status(401)
      .json({
        success: false,
        message: "Invalid or expired authentication token",
      });
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });
  if (!user || !user.isActive)
    return res
      .status(401)
      .json({ success: false, message: "Account is unavailable" });
  req.user = user;
  next();
});
