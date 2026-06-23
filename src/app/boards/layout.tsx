import { redirect } from "next/navigation";
import { AppShell } from "@/shared/ui/components/app-shell";
import { logout } from "@/features/auth/actions/logout";
import { getCurrentUser } from "@/shared/lib/auth/dal";
import { getDueTaskNotifications } from "@/features/notifications/queries/get-due-task-notifications";

export default async function BoardsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { dueNotifications, assignedTasks, pendingConfirmation } = await getDueTaskNotifications();

  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      notifications={dueNotifications}
      assignedTasks={assignedTasks}
      pendingConfirmation={pendingConfirmation}
      logoutAction={logout}
    >
      {children}
    </AppShell>
  );
}
