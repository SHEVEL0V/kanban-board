"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SearchIcon from "@mui/icons-material/Search";
import Tooltip from "@mui/material/Tooltip";
import { useColorScheme } from "@mui/material/styles";
import Link from "next/link";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { setLocale } from "@/shared/i18n/set-locale";
import { routes } from "@/shared/lib/routing/routes";
import type { Locale } from "@/shared/i18n/get-dictionary";
import { UserMenu } from "@/features/profile/ui/user-menu";
import { NotificationBell } from "@/features/notifications/ui/notification-bell";
import { GlobalSearch } from "@/features/search/ui/global-search";
import type { AssignedTaskNotification, DueTaskNotification } from "@/features/notifications/queries/get-due-task-notifications";

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  const { dict } = useDictionary();

  return (
    <IconButton
      aria-label={dict.nav.toggleTheme}
      onClick={() => setMode(mode === "dark" ? "light" : "dark")}
      color="inherit"
    >
      {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}

function LanguageSwitcher() {
  const { locale } = useDictionary();
  const next: Locale = locale === "uk" ? "en" : "uk";

  return (
    <IconButton
      color="inherit"
      onClick={() => setLocale(next)}
      aria-label={`Switch to ${next.toUpperCase()}`}
      sx={{ fontSize: "0.8125rem", fontWeight: 600, width: 40, height: 40 }}
    >
      {locale.toUpperCase()}
    </IconButton>
  );
}

export function AppShell({
  children,
  user,
  notifications,
  assignedTasks,
  logoutAction,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  notifications: DueTaskNotification[];
  assignedTasks: AssignedTaskNotification[];
  logoutAction: () => Promise<void>;
}) {
  const { dict } = useDictionary();
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" color="secondary" enableColorOnDark>
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            variant="h6"
            component={Link}
            href={routes.boards()}
            sx={{ flexGrow: 1, color: "inherit" }}
          >
            {dict.common.appName}
          </Typography>
          <Tooltip title={dict.search.hint}>
            <IconButton color="inherit" onClick={() => setSearchOpen(true)}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <LanguageSwitcher />
          <ThemeToggle />
          <NotificationBell notifications={notifications} assignedTasks={assignedTasks} />
          <UserMenu name={user.name} email={user.email} logoutAction={logoutAction} />
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>

      <GlobalSearch open={searchOpen} onCloseAction={() => setSearchOpen(false)} />
    </Box>
  );
}
