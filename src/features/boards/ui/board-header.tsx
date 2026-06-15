"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { routes } from "@/shared/lib/routes";

export function BoardHeader({ title }: { title: string }) {
  const { dict } = useDictionary();

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <Button component={Link} href={routes.boards()} startIcon={<ArrowBackIcon />} size="small">
        {dict.nav.boards}
      </Button>
      <Typography variant="h4" component="h1" noWrap>
        {title}
      </Typography>
    </Stack>
  );
}
