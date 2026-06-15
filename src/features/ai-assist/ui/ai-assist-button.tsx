"use client";

import * as React from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { AiAssistDialog } from "@/features/ai-assist/ui/ai-assist-dialog";
import type { ColumnWithTasks } from "@/features/columns/ui/column-list";
import { useDictionary } from "@/shared/i18n/dictionary-context";

export function AiAssistButton({ boardId, columns }: { boardId: string; columns: ColumnWithTasks[] }) {
  const { dict } = useDictionary();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Tooltip title={dict.aiAssist.title}>
        <IconButton onClick={() => setOpen(true)}>
          <AutoAwesomeIcon />
        </IconButton>
      </Tooltip>
      <AiAssistDialog open={open} boardId={boardId} columns={columns} onCloseAction={() => setOpen(false)} />
    </>
  );
}
