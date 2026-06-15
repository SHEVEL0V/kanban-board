"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { useDictionary } from "@/shared/i18n/dictionary-context";

type Member = { id: string; user: { id: string; name: string; email: string } };

export function BoardMembersDialog({
  open,
  owner,
  members,
  currentUserId,
  isOwner,
  pending = false,
  onCloseAction,
  onInviteAction,
  onRemoveAction,
}: {
  open: boolean;
  owner: { id: string; name: string };
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
  pending?: boolean;
  onCloseAction: () => void;
  onInviteAction: (email: string) => void;
  onRemoveAction: (memberId: string) => void;
}) {
  const { dict } = useDictionary();
  const [email, setEmail] = React.useState("");
  const [removeTarget, setRemoveTarget] = React.useState<Member | null>(null);

  // Reset the invite field when the dialog opens, without an effect-driven re-render.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setEmail("");
  }

  const submit = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    onInviteAction(trimmed);
    setEmail("");
  };

  return (
    <>
      <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="xs">
        <DialogTitle>{dict.boards.manageMembers}</DialogTitle>
        <DialogContent>
          <List dense disablePadding>
            <ListItem disableGutters secondaryAction={<Chip size="small" label={dict.boards.owner} />}>
              <ListItemText primary={owner.id === currentUserId ? dict.boards.you : owner.name} />
            </ListItem>
            {members.map((member) => {
              const isSelf = member.user.id === currentUserId;
              const canRemove = isOwner || isSelf;

              return (
                <ListItem
                  key={member.id}
                  disableGutters
                  secondaryAction={
                    canRemove ? (
                      <IconButton
                        edge="end"
                        size="small"
                        disabled={pending}
                        onClick={() => setRemoveTarget(member)}
                      >
                        {isSelf ? <LogoutIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
                      </IconButton>
                    ) : null
                  }
                >
                  <ListItemText
                    primary={isSelf ? dict.boards.you : member.user.name}
                    secondary={member.user.email}
                  />
                </ListItem>
              );
            })}
          </List>

          {members.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {dict.boards.noMembers}
            </Typography>
          ) : null}

          {isOwner ? (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="email"
                label={dict.boards.inviteEmail}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
              />
              <Button onClick={submit} disabled={pending || !email.trim()} variant="contained">
                {dict.boards.invite}
              </Button>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={removeTarget !== null}
        title={removeTarget?.user.id === currentUserId ? dict.boards.leave : dict.common.delete}
        description={dict.boards.removeMemberConfirm.replace("{name}", removeTarget?.user.name ?? "")}
        onCloseAction={() => setRemoveTarget(null)}
        onConfirmAction={() => {
          if (removeTarget) onRemoveAction(removeTarget.id);
        }}
      />
    </>
  );
}
