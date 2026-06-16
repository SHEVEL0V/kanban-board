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
import { createComment } from "@/features/comments/actions/create-comment";
import { deleteComment } from "@/features/comments/actions/delete-comment";
import { getComments, type CommentWithAuthor } from "@/features/comments/actions/get-comments";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import type { ErrorCode } from "@/shared/lib/actions/result";

// Self-contained: fetches its own comments on mount and after each mutation.
export function CommentsSection({
  taskId,
  boardId,
  currentUserId,
}: {
  taskId: string;
  boardId: string;
  currentUserId: string;
}) {
  const { dict, locale } = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = React.useState("");
  const [comments, setComments] = React.useState<CommentWithAuthor[]>([]);
  const [fetchError, setFetchError] = React.useState<ErrorCode | null>(null);
  const { error: mutationError, run, clearError } = useActionFeedback();
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  // Monotonic counter: only the latest in-flight fetch applies its result.
  const fetchGenRef = React.useRef(0);

  const refetch = React.useCallback(() => {
    const gen = ++fetchGenRef.current;
    startTransition(async () => {
      const result = await getComments({ taskId });
      if (gen !== fetchGenRef.current) return;
      if (result.ok && result.data) {
        setComments(result.data);
        setFetchError(null);
      } else if (!result.ok) {
        setFetchError(result.code);
      }
    });
  }, [taskId]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setContent("");
    startTransition(() =>
      run(async () => {
        const result = await createComment({ taskId, boardId, content: trimmed });
        if (result.ok) refetch();
        return result;
      }),
    );
  };

  const handleDelete = (commentId: string) => {
    startTransition(() =>
      run(async () => {
        const result = await deleteComment({ commentId, boardId });
        if (result.ok) refetch();
        return result;
      }),
    );
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
                <IconButton size="small" onClick={() => handleDelete(comment.id)}>
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

      <ErrorSnackbar
        error={fetchError ?? mutationError}
        onCloseAction={() => {
          clearError();
          setFetchError(null);
        }}
      />
    </Stack>
  );
}
