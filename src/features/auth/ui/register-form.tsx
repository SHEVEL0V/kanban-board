"use client";

import { useActionState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import { register } from "@/features/auth/actions/register";
import { FormErrorAlert } from "@/shared/ui/components/form-error-alert";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { routes } from "@/shared/lib/routing/routes";
import type { Result } from "@/shared/lib/actions/result";

export function RegisterForm() {
  const { dict } = useDictionary();
  const [result, formAction, pending] = useActionState<Result<never> | null, FormData>(
    (_prev, formData) => register(formData),
    null,
  );

  return (
    <Box component="form" action={formAction} sx={{ width: "100%", maxWidth: 400 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {dict.auth.registerTitle}
      </Typography>

      {result && !result.ok && <FormErrorAlert code={result.code} />}

      <Stack spacing={2} sx={{ mt: 2 }}>
        <TextField name="name" label={dict.auth.name} required fullWidth autoFocus />
        <TextField name="email" type="email" label={dict.auth.email} required fullWidth />
        <TextField name="password" type="password" label={dict.auth.password} required fullWidth />
        <Button type="submit" variant="contained" size="large" disabled={pending}>
          {dict.auth.registerButton}
        </Button>
        <Typography variant="body2">
          {dict.auth.haveAccount}{" "}
          <Link href={routes.login()}>{dict.auth.goToLogin}</Link>
        </Typography>
      </Stack>
    </Box>
  );
}
