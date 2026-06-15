"use client";

import * as React from "react";
import { useTransition } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import { createComment } from "@/features/tasks/comments/actions/create-comment";
import { deleteComment } from "@/features/tasks/comments/actions/delete-comment";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import type { CommentWithAuthor } from "@/features/boards/queries/get-board";

export function CommentsSection({
  taskId,
  boardId,
  comments,
  currentUserId,
}: {
  taskId: string;
  boardId: string;
  comments: CommentWithAuthor[];
  currentUserId: string;
}) {
  const { dict, locale } = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = React.useState("");
  const { error, run, clearError } = useActionFeedback();
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setContent("");
    startTransition(() => run(() => createComment({ taskId, boardId, content: trimmed })));
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{dict.comments.title}</Typography>

      {comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {dict.comments.empty}
        </Typography>
      ) : (
        <Stack spacing={1} divider={<Divider />}>
          {comments.map((comment) => (
            <Stack key={comment.id} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
              <Stack spacing={0.25} sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {comment.content}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {comment.author.name} · {formatter.format(comment.createdAt)}
                </Typography>
              </Stack>
              {comment.authorId === currentUserId ? (
                <IconButton
                  size="small"
                  onClick={() => startTransition(() => run(() => deleteComment({ commentId: comment.id, boardId })))}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              ) : null}
            </Stack>
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={4}
          placeholder={dict.comments.placeholder}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <IconButton onClick={submit} disabled={isPending || !content.trim()}>
          <SendIcon />
        </IconButton>
      </Stack>

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </Stack>
  );
}
