"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/lib/prisma";
import { runAction } from "@/shared/lib/run-action";
import { createSession } from "@/shared/lib/session";
import { ErrorCode, err } from "@/shared/lib/result";
import { routes } from "@/shared/lib/routes";
import { loginSchema } from "@/features/auth/schema/auth-schema";

export const login = runAction({
  schema: loginSchema,
  requireAuth: false,
  handler: async ({ email, password }) => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return err(ErrorCode.INVALID_CREDENTIALS);
    }

    await createSession(user.id);
    redirect(routes.boards());
  },
});
