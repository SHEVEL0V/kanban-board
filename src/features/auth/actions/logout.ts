"use server";

import { redirect } from "next/navigation";
import { deleteSession } from "@/shared/lib/session";
import { routes } from "@/shared/lib/routes";

export async function logout(): Promise<void> {
  await deleteSession();
  redirect(routes.login());
}
