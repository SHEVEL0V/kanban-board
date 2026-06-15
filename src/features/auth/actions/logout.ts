"use server";

import { redirect } from "next/navigation";
import { deleteSession } from "@/shared/lib/auth/session";
import { routes } from "@/shared/lib/routing/routes";

export async function logout(): Promise<void> {
  await deleteSession();
  redirect(routes.login());
}
