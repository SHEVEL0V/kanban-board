import { z } from "zod";

export const boardRoleSchema = z.enum(["EDITOR", "VIEWER"]);

export const inviteMemberSchema = z.object({
  boardId: z.string().min(1),
  email: z.string().trim().email(),
  role: boardRoleSchema.default("EDITOR"),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const removeMemberSchema = z.object({
  boardId: z.string().min(1),
  memberId: z.string().min(1),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

export const updateMemberRoleSchema = z.object({
  boardId: z.string().min(1),
  memberId: z.string().min(1),
  role: boardRoleSchema,
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
