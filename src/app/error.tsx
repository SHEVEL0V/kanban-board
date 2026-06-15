"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { routes } from "@/shared/lib/routing/routes";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { dict } = useDictionary();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="h2" component="h1">
        {dict.error.title}
      </Typography>
      <Typography color="text.secondary">{dict.error.message}</Typography>
      <Stack direction="row" spacing={2}>
        <Button onClick={reset} variant="contained">
          {dict.error.retry}
        </Button>
        <Button component={Link} href={routes.home()} variant="outlined">
          {dict.error.backHome}
        </Button>
      </Stack>
    </Box>
  );
}
