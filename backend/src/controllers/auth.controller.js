import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { registerUser, safeUser } from "../services/auth.service.js";
import { generateToken, cookieOptions } from "../utils/generateToken.js";

const validEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export async function register(req, res) {
  const { fullName, email, password, role, institutionName, companyName } =
    req.body || {};
  if (
    !fullName?.trim() ||
    !validEmail(email) ||
    typeof password !== "string" ||
    password.length < 8 ||
    !["STUDENT", "INSTITUTION", "INDUSTRY"].includes(role)
  )
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Provide fullName, valid email, password (at least 8 characters), and a permitted role",
      });
  if (role === "INSTITUTION" && !institutionName?.trim())
    return res
      .status(400)
      .json({ success: false, message: "institutionName is required" });
  if (role === "INDUSTRY" && !companyName?.trim())
    return res
      .status(400)
      .json({ success: false, message: "companyName is required" });
  const user = await registerUser(req.body);
  res.status(201).json({ success: true, data: { user } });
}
export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!validEmail(email) || typeof password !== "string")
    return res
      .status(400)
      .json({
        success: false,
        message: "Valid email and password are required",
      });
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (
    !user ||
    !user.isActive ||
    !(await bcrypt.compare(password, user.password))
  )
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  res
    .cookie("token", generateToken(user), cookieOptions())
    .json({ success: true, data: { user: safeUser(user) } });
}
export function logout(req, res) {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    })
    .json({ success: true, message: "Logged out" });
}
export function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}
