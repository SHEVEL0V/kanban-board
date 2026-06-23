"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { createSession } from "@/shared/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/shared/lib/auth/rate-limit";
import { ErrorCode, err } from "@/shared/lib/actions/result";
import { routes } from "@/shared/lib/routing/routes";
import { loginSchema } from "@/features/auth/schema/auth-schema";

const LOGIN_LIMIT = 5;           // per IP+email: prevents targeting one account
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_IP_LIMIT = 20;       // per IP: prevents password-spray across accounts
const LOGIN_IP_WINDOW_MS = 10 * 60 * 1000;

export const login = runAction({
  schema: loginSchema,
  requireAuth: false,
  handler: async ({ email, password }) => {
    const ip = await getClientIp();
    if (!(await checkRateLimit(`login:ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_IP_WINDOW_MS))) {
      return err(ErrorCode.RATE_LIMITED);
    }
    if (!(await checkRateLimit(`login:${ip}:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS))) {
      return err(ErrorCode.RATE_LIMITED);
    }

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
