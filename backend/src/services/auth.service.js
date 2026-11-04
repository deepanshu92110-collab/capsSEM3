import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";

export const safeUser = (user) => {
  if (!user) return user;
  const { password, ...safe } = user;
  return safe;
};
export async function registerUser(data) {
  const email = data.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    const error = new Error("Email is already registered");
    error.status = 409;
    throw error;
  }
  const password = await bcrypt.hash(data.password, 12);
  const role = data.role;
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: data.fullName.trim(),
        email,
        password,
        phone: data.phone || null,
        role,
      },
    });
    if (role === "INSTITUTION")
      await tx.institution.create({
        data: {
          userId: user.id,
          name: data.institutionName.trim(),
          officialEmail: (data.officialEmail || email).trim().toLowerCase(),
        },
      });
    if (role === "INDUSTRY")
      await tx.company.create({
        data: {
          userId: user.id,
          name: data.companyName.trim(),
          officialEmail: (data.officialEmail || email).trim().toLowerCase(),
        },
      });
    if (role === "STUDENT")
      await tx.studentProfile.create({ data: { userId: user.id } });
    return safeUser(user);
  });
}
