"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { CacheTags } from "@/shared/lib/actions/cache-tags";
import { ok } from "@/shared/lib/actions/result";
import { updateProfileSchema } from "@/features/profile/schema/profile-schema";

export const updateProfile = runAction({
  schema: updateProfileSchema,
  revalidate: () => [CacheTags.boards()],
  handler: async ({ name }, session) => {
    await prisma.user.update({ where: { id: session.userId }, data: { name } });
    return ok(undefined);
  },
});
