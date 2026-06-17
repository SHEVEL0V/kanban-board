"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { createSession } from "@/shared/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/shared/lib/auth/rate-limit";
import { ErrorCode, err } from "@/shared/lib/actions/result";
import { routes } from "@/shared/lib/routing/routes";
import { registerSchema } from "@/features/auth/schema/auth-schema";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

export const register = runAction({
  schema: registerSchema,
  requireAuth: false,
  handler: async ({ name, email, password }) => {
    const ip = await getClientIp();
    if (!(await checkRateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS))) {
      return err(ErrorCode.RATE_LIMITED);
    }

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
