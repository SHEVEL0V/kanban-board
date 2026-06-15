"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useColorScheme } from "@mui/material/styles";
import Link from "next/link";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { setLocale } from "@/shared/i18n/set-locale";
import { routes } from "@/shared/lib/routes";
import type { Locale } from "@/shared/i18n/get-dictionary";

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

  return (
    <Select
      value={locale}
      onChange={(event) => setLocale(event.target.value as Locale)}
      size="small"
      variant="standard"
      sx={{ color: "inherit", "&::before, &::after": { borderColor: "inherit" } }}
    >
      <MenuItem value="uk">UK</MenuItem>
      <MenuItem value="en">EN</MenuItem>
    </Select>
  );
}

export function AppShell({
  children,
  logoutAction,
}: {
  children: React.ReactNode;
  logoutAction: () => Promise<void>;
}) {
  const { dict } = useDictionary();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            variant="h6"
            component={Link}
            href={routes.boards()}
            sx={{ flexGrow: 1, color: "inherit" }}
          >
            {dict.common.appName}
          </Typography>
          <LanguageSwitcher />
          <ThemeToggle />
          <Button color="inherit" onClick={logoutAction}>
            {dict.nav.logout}
          </Button>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
