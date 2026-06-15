import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(100),
  newPassword: z.string().min(8).max(100),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
