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
          main: "#7048e8", // Залишено оригінальний, або заміни на потрібний
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
          main: "#9775fa", // Залишено оригінальний, або заміни на потрібний
        },
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
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
