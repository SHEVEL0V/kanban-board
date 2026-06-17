"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import SearchIcon from "@mui/icons-material/Search";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { routes } from "@/shared/lib/routing/routes";
import { PRIORITY_COLOR } from "@/features/tasks/lib/priority-color";
import { searchTasks, type SearchResult } from "@/features/search/actions/search-tasks";

// Global Cmd+K search dialog, mounted once in AppShell.
export function GlobalSearch({ open, onCloseAction }: { open: boolean; onCloseAction: () => void }) {
  const { dict } = useDictionary();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  // Guards against stale responses from concurrent in-flight searches.
  const searchIdRef = React.useRef(0);

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setResults([]);
    }
  }

  const handleChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = ++searchIdRef.current;
    startTransition(async () => {
      const result = await searchTasks({ query: value });
      if (result.ok && id === searchIdRef.current) {
        setResults(result.data);
      }
    });
  };

  const handleSelect = (result: SearchResult) => {
    onCloseAction();
    router.push(routes.board(result.column.board.id));
  };

  const priorityColors: Record<string, string> = {
    success: "#22c55e",
    warning: "#f97316",
    error: "#ef4444",
    default: "transparent",
  };

  return (
    <Dialog
      open={open}
      onClose={onCloseAction}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { mt: "10vh", verticalAlign: "top" } } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder={dict.search.placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {isPending ? <CircularProgress size={18} /> : <SearchIcon />}
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 0 },
            "& fieldset": { border: "none" },
          }}
        />

        {results.length > 0 ? (
          <List dense disablePadding sx={{ borderTop: 1, borderColor: "divider", maxHeight: 400, overflow: "auto" }}>
            {results.map((result) => {
              const colorKey = PRIORITY_COLOR[result.priority];
              const accentColor = priorityColors[colorKey] ?? priorityColors.default;
              return (
                <ListItemButton
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  sx={{ borderLeft: 3, borderColor: accentColor, gap: 1 }}
                >
                  <ListItemText
                    primary={result.title}
                    secondary={`${result.column.board.title} › ${result.column.title}`}
                    slotProps={{ primary: { variant: "body2" }, secondary: { variant: "caption" } }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        ) : query.trim().length >= 2 && !isPending ? (
          <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary">
              {dict.search.noResults}
            </Typography>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
