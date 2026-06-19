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
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import type { BoardRole } from "@/generated/prisma/client";

type Member = {
  id: string;
  role: BoardRole;
  user: { id: string; name: string; email: string };
};

export function BoardMembersDialog({
  open,
  owner,
  members,
  currentUserId,
  isOwner,
  pending,
  inviteRole,
  onCloseAction,
  onInviteAction,
  onRemoveAction,
  onRoleChangeAction,
  onInviteRoleChangeAction,
}: {
  open: boolean;
  owner: { id: string; name: string };
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
  pending?: boolean;
  inviteRole?: BoardRole;
  onCloseAction: () => void;
  onInviteAction: (email: string, role: BoardRole) => void;
  onRemoveAction: (memberId: string) => void;
  onRoleChangeAction?: (memberId: string, role: BoardRole) => void;
  onInviteRoleChangeAction?: (role: BoardRole) => void;
}) {
  const { dict } = useDictionary();
  const [email, setEmail] = React.useState("");
  const [localInviteRole, setLocalInviteRole] = React.useState<BoardRole>(inviteRole ?? "EDITOR");
  const [removeTarget, setRemoveTarget] = React.useState<Member | null>(null);

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setEmail("");
      setLocalInviteRole("EDITOR");
    }
  }

  const submit = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    onInviteAction(trimmed, localInviteRole);
    setEmail("");
  };

  const roleLabel = (role: BoardRole) =>
    role === "EDITOR" ? dict.boards.roleEditor : dict.boards.roleViewer;

  return (
    <>
      <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="xs">
        <DialogTitle>{dict.boards.manageMembers}</DialogTitle>
        <DialogContent>
          <List dense disablePadding>
            {/* Owner row */}
            <ListItem disableGutters secondaryAction={<Chip size="small" label={dict.boards.owner} />}>
              <ListItemText primary={owner.id === currentUserId ? dict.boards.you : owner.name} />
            </ListItem>

            {/* Member rows */}
            {members.map((member) => {
              const isSelf = member.user.id === currentUserId;
              const canRemove = isOwner || isSelf;

              return (
                <ListItem
                  key={member.id}
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
                      {isOwner && !isSelf && onRoleChangeAction ? (
                        <Select
                          size="small"
                          value={member.role}
                          disabled={pending}
                          onChange={(e) => onRoleChangeAction(member.id, e.target.value as BoardRole)}
                          sx={{ fontSize: "0.75rem", "& .MuiSelect-select": { py: 0.25, px: 1 } }}
                        >
                          <MenuItem value="EDITOR">{dict.boards.roleEditor}</MenuItem>
                          <MenuItem value="VIEWER">{dict.boards.roleViewer}</MenuItem>
                        </Select>
                      ) : (
                        <Chip
                          size="small"
                          label={roleLabel(member.role)}
                          variant="outlined"
                          color={member.role === "VIEWER" ? "default" : "primary"}
                        />
                      )}
                      {canRemove && (
                        <IconButton
                          edge="end"
                          size="small"
                          disabled={pending}
                          onClick={() => setRemoveTarget(member)}
                        >
                          {isSelf ? <LogoutIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      )}
                    </Stack>
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

          {members.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {dict.boards.noMembers}
            </Typography>
          )}

          {isOwner && (
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label={dict.boards.inviteEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                />
                <TextField
                  select
                  size="small"
                  label={dict.boards.role}
                  value={localInviteRole}
                  onChange={(e) => {
                    const role = e.target.value as BoardRole;
                    setLocalInviteRole(role);
                    onInviteRoleChangeAction?.(role);
                  }}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="EDITOR">{dict.boards.roleEditor}</MenuItem>
                  <MenuItem value="VIEWER">{dict.boards.roleViewer}</MenuItem>
                </TextField>
              </Stack>
              <Button
                onClick={submit}
                disabled={pending || !email.trim()}
                variant="contained"
                fullWidth
              >
                {dict.boards.invite}
              </Button>
            </Stack>
          )}
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
          setRemoveTarget(null);
        }}
      />
    </>
  );
}
