import { AppShell } from "@/shared/ui/components/app-shell";
import { logout } from "@/features/auth/actions/logout";

export default function BoardsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell logoutAction={logout}>{children}</AppShell>;
}
