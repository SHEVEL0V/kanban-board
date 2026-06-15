"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { createSession } from "@/shared/lib/session";
import { ErrorCode, err } from "@/shared/lib/result";
import { routes } from "@/shared/lib/routes";
import { registerSchema } from "@/features/auth/schema/auth-schema";

export const register = runAction({
  schema: registerSchema,
  requireAuth: false,
  handler: async ({ name, email, password }) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return err(ErrorCode.EMAIL_TAKEN);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true },
    });

    await createSession(user.id);
    redirect(routes.boards());
  },
});
