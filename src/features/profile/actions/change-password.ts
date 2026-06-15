"use server";

import bcrypt from "bcrypt";
import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { changePasswordSchema } from "@/features/profile/schema/profile-schema";

export const changePassword = runAction({
  schema: changePasswordSchema,
  handler: async ({ currentPassword, newPassword }, session) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { passwordHash: true },
    });

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return err(ErrorCode.INCORRECT_PASSWORD);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: session.userId }, data: { passwordHash } });

    return ok(undefined);
  },
});
