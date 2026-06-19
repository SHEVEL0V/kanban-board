"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import LoopIcon from "@mui/icons-material/Loop";
import PersonIcon from "@mui/icons-material/Person";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { BOARD_TEMPLATES, type BoardTemplate } from "@/features/boards/lib/board-templates";

type TemplateId = BoardTemplate["id"];

const TEMPLATE_ICONS: Record<TemplateId, React.ReactNode> = {
  blank: <GridViewIcon />,
  kanban: <ViewKanbanIcon />,
  scrum: <LoopIcon />,
  personal: <PersonIcon />,
};

export function CreateBoardDialog({
  open,
  pending,
  onCloseAction,
  onSubmitAction,
}: {
  open: boolean;
  pending: boolean;
  onCloseAction: () => void;
  onSubmitAction: (title: string, template: BoardTemplate) => void;
}) {
  const { dict } = useDictionary();
  const [title, setTitle] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<TemplateId>("kanban");

  // Reset state when dialog opens.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle("");
      setSelectedId("kanban");
    }
  }

  const templateLabels: Record<TemplateId, { name: string; desc: string }> = {
    blank: { name: dict.boards.templateBlank, desc: dict.boards.templateBlankDesc },
    kanban: { name: dict.boards.templateKanban, desc: dict.boards.templateKanbanDesc },
    scrum: { name: dict.boards.templateScrum, desc: dict.boards.templateScrumDesc },
    personal: { name: dict.boards.templatePersonal, desc: dict.boards.templatePersonalDesc },
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const template = BOARD_TEMPLATES.find((t) => t.id === selectedId)!;
    onSubmitAction(trimmed, template);
  };

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
      <DialogTitle>{dict.boards.newBoard}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {dict.boards.newBoardTemplate}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1.5,
            mb: 3,
          }}
        >
          {BOARD_TEMPLATES.map((template) => {
            const isSelected = template.id === selectedId;
            const label = templateLabels[template.id as TemplateId];
            if (!label) return null;
            return (
              <Box
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                sx={{
                  border: 2,
                  borderColor: isSelected ? "primary.main" : "divider",
                  borderRadius: 2,
                  p: 2,
                  cursor: "pointer",
                  bgcolor: isSelected ? "primary.main" : "transparent",
                  color: isSelected ? "primary.contrastText" : "text.primary",
                  transition: "border-color 0.15s, background-color 0.15s",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.5 }}>
                  {TEMPLATE_ICONS[template.id]}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {label.name}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {label.desc}
                </Typography>
                {template.columns.length > 0 && (
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                    {template.columns.map((col) => (
                      <Chip
                        key={col.order}
                        label={col.title}
                        size="small"
                        sx={{
                          bgcolor: isSelected ? "rgba(255,255,255,0.2)" : "action.selected",
                          color: "inherit",
                          fontSize: "0.65rem",
                          height: 20,
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            );
          })}
        </Box>

        <TextField
          autoFocus
          fullWidth
          label={dict.boards.boardTitle}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          disabled={pending}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction} disabled={pending}>
          {dict.common.cancel}
        </Button>
        <Button
          variant="contained"
          disabled={pending || !title.trim()}
          onClick={handleSubmit}
        >
          {dict.common.create}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
