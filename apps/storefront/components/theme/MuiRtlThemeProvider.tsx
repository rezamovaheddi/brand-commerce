"use client";

import type { ReactNode } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const rtlTheme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: "var(--font-vazir), 'Vazirmatn RD UI FD', 'Vazirmatn', Tahoma, Arial, sans-serif",
    h1: { fontWeight: 800, letterSpacing: 0 },
    h2: { fontWeight: 800, letterSpacing: 0 },
    h3: { fontWeight: 700, letterSpacing: 0 },
    h4: { fontWeight: 700, letterSpacing: 0 },
    button: { fontWeight: 700, letterSpacing: 0, textTransform: "none" },
  },
  palette: {
    primary: {
      main: "#5B2182",
      dark: "#240B3B",
      light: "#8C4BB8",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#E2BE74",
      dark: "#C79A3B",
      light: "#F4D996",
      contrastText: "#1A2254",
    },
    text: {
      primary: "#1A2254",
      secondary: "#5A6282",
    },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(91, 33, 130, 0.18)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: "14px !important",
          boxShadow: "0 2px 12px rgba(26, 34, 84, 0.04)",
          "&::before": { display: "none" },
        },
      },
    },
  },
});

export default function MuiRtlThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <ThemeProvider theme={rtlTheme}>{children}</ThemeProvider>;
}
