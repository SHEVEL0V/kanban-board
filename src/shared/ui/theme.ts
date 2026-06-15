import { createTheme } from "@mui/material/styles";

// Single source of truth for design tokens (palette, spacing, radii) — components
// must consume these via the theme, never hardcoded hex/px values.
export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data",
  },
  colorSchemes: {
    light: {
      palette: {
        mode: "light",
        primary: {
          main: "#2563eb",
          contrastText: "#ffffff",
        },
        secondary: {
          main: "#f1f5f9",
        },
        error: {
          main: "#ef4444",
        },
        success: {
          main: "#22c55e",
        },
        warning: {
          main: "#f59e0b",
        },
        text: {
          primary: "#0f172a",
          secondary: "#475569",
        },
        background: {
          default: "#f1f5f9",
          paper: "#ffffff",
        },
        divider: "rgba(15, 23, 42, 0.12)",
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: {
          main: "#60a5fa",
          contrastText: "#ffffff",
        },
        secondary: {
          main: "#334155",
        },
        text: {
          primary: "#f8fafc",
          secondary: "#cbd5e1",
        },
        error: {
          main: "#f87171",
        },
        success: {
          main: "#4ade80",
        },
        warning: {
          main: "#fbbf24",
        },
        background: {
          default: "#0f172a",
          paper: "#1e293b",
        },
        divider: "rgba(255, 255, 255, 0.12)",
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
});
