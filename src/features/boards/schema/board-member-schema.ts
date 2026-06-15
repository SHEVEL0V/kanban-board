import { z } from "zod";

export const inviteMemberSchema = z.object({
  boardId: z.string().min(1),
  email: z.string().trim().email(),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const removeMemberSchema = z.object({
  boardId: z.string().min(1),
  memberId: z.string().min(1),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
