import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const select = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};
export const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select,
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: { users } });
});
export const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select,
  });
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: { user } });
});
export const updateUser = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.id !== req.params.id)
    return res
      .status(403)
      .json({
        success: false,
        message: "You may only update your own account",
      });
  const { fullName, phone } = req.body || {};
  if (!fullName?.trim() && phone === undefined)
    return res
      .status(400)
      .json({ success: false, message: "Provide fullName or phone" });
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
    },
    select,
  });
  res.json({ success: true, data: { user } });
});
export const setUserStatus = asyncHandler(async (req, res) => {
  if (typeof req.body?.isActive !== "boolean")
    return res
      .status(400)
      .json({ success: false, message: "isActive must be a boolean" });
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: req.body.isActive },
    select,
  });
  res.json({ success: true, data: { user } });
});
