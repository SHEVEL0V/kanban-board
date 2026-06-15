"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import { ProfileDialog } from "@/features/profile/ui/profile-dialog";
import { useDictionary } from "@/shared/i18n/dictionary-context";

export function UserMenu({
  name,
  email,
  logoutAction,
}: {
  name: string;
  email: string;
  logoutAction: () => Promise<void>;
}) {
  const { dict } = useDictionary();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);

  return (
    <>
      <Button
        color="inherit"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={<AccountCircleIcon />}
        sx={{ textTransform: "none" }}
      >
        {name}
      </Button>
      <Menu anchorEl={anchorEl} open={anchorEl !== null} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setProfileOpen(true);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{dict.nav.editProfile}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            void logoutAction();
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{dict.nav.logout}</ListItemText>
        </MenuItem>
      </Menu>

      <ProfileDialog
        open={profileOpen}
        name={name}
        email={email}
        onCloseAction={() => setProfileOpen(false)}
      />
    </>
  );
}
