"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { updateProfile } from "@/features/profile/actions/update-profile";
import { changePassword } from "@/features/profile/actions/change-password";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";

export function ProfileDialog({
  open,
  name,
  email,
  onCloseAction,
}: {
  open: boolean;
  name: string;
  email: string;
  onCloseAction: () => void;
}) {
  const { dict } = useDictionary();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nameValue, setNameValue] = React.useState(name);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const { error, run, clearError } = useActionFeedback();

  // Reset the fields when the dialog opens, without an effect-driven re-render.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setNameValue(name);
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  const saveName = () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === name) return;
    startTransition(() =>
      run(async () => {
        const result = await updateProfile({ name: trimmed });
        if (result.ok) router.refresh();
        return result;
      }),
    );
  };

  const savePassword = () => {
    if (!currentPassword || newPassword.length < 8) return;
    startTransition(() =>
      run(async () => {
        const result = await changePassword({ currentPassword, newPassword });
        if (result.ok) {
          setCurrentPassword("");
          setNewPassword("");
        }
        return result;
      }),
    );
  };

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="xs">
      <DialogTitle>{dict.profile.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label={dict.profile.name}
            value={nameValue}
            onChange={(event) => setNameValue(event.target.value)}
          />
          <TextField fullWidth label={dict.profile.email} value={email} disabled />
          <Button
            onClick={saveName}
            disabled={isPending || !nameValue.trim() || nameValue.trim() === name}
            variant="contained"
            sx={{ alignSelf: "flex-start" }}
          >
            {dict.common.save}
          </Button>

          <Divider />

          <Typography variant="subtitle2">{dict.profile.changePassword}</Typography>
          <TextField
            fullWidth
            type="password"
            label={dict.profile.currentPassword}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <TextField
            fullWidth
            type="password"
            label={dict.profile.newPassword}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Button
            onClick={savePassword}
            disabled={isPending || !currentPassword || newPassword.length < 8}
            variant="contained"
            sx={{ alignSelf: "flex-start" }}
          >
            {dict.common.save}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
      </DialogActions>

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </Dialog>
  );
}
