import type { Comment, User } from "@/types";
import { useMemo, useRef, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  useAddCommentMutation,
  useGetCommentsByTaskIdQuery,
} from "@/hooks/use-task";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Loader } from "../loader";
import { cn } from "@/lib/utils";
import { useRoom } from "@/hooks/use-room";

interface MentionedUser {
  id: string;
  name: string;
}

export const CommentSection = ({
  taskId,
  members,
  canEdit = true,
}: {
  taskId: string;
  members: User[];
  canEdit?: boolean;
}) => {
  useRoom(`task:${taskId}`);
  const [newComment, setNewComment] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionedUsers, setMentionedUsers] = useState<
    Map<string, MentionedUser>
  >(new Map());

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { mutate: addComment, isPending } = useAddCommentMutation();
  const { data: comments, isLoading } = useGetCommentsByTaskIdQuery(taskId) as {
    data: Comment[];
    isLoading: boolean;
  };

  const filteredMembers = useMemo(() => {
    if (mentionQuery === null || !members) return [];
    const q = mentionQuery.toLowerCase();
    return members
      .filter((m) => m?.name?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [mentionQuery, members]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart ?? value.length;
    setNewComment(value);

    // cherche le "@" le plus proche avant le curseur, sans espace entre les deux
    const textBeforeCursor = value.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex === -1) {
      setMentionQuery(null);
      setMentionStart(null);
      return;
    }

    const textAfterAt = textBeforeCursor.slice(atIndex + 1);
    if (/\s/.test(textAfterAt)) {
      setMentionQuery(null);
      setMentionStart(null);
      return;
    }

    setMentionQuery(textAfterAt);
    setMentionStart(atIndex);
  };

  const handleSelectMention = (member: User) => {
    if (mentionStart === null) return;

    const cursorPos = textareaRef.current?.selectionStart ?? newComment.length;
    const before = newComment.slice(0, mentionStart);
    const after = newComment.slice(cursorPos);
    const insertion = `@${member.name} `;

    const updated = `${before}${insertion}${after}`;
    setNewComment(updated);

    setMentionedUsers((prev) => {
      const next = new Map(prev);
      next.set(member.name, { id: member._id, name: member.name });
      return next;
    });

    setMentionQuery(null);
    setMentionStart(null);

    // remet le focus après l'insertion
    requestAnimationFrame(() => {
      const pos = before.length + insertion.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const buildMentionsPayload = () => {
    // pour chaque utilisateur mentionné, retrouve toutes les occurrences "@Nom"
    // dans le texte final, du nom le plus long au plus court pour éviter
    // qu'un nom court écrase un match plus long qui le contient.
    const entries = Array.from(mentionedUsers.values()).sort(
      (a, b) => b.name.length - a.name.length,
    );

    const mentions: { user: string; offset: number; length: number }[] = [];

    for (const entry of entries) {
      const pattern = `@${entry.name}`;
      let searchFrom = 0;
      let idx = newComment.indexOf(pattern, searchFrom);
      while (idx !== -1) {
        mentions.push({ user: entry.id, offset: idx, length: pattern.length });
        searchFrom = idx + pattern.length;
        idx = newComment.indexOf(pattern, searchFrom);
      }
    }

    return mentions;
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const mentions = buildMentionsPayload();

    addComment(
      { taskId, text: newComment, mentions },
      {
        onSuccess: () => {
          setNewComment("");
          setMentionedUsers(new Map());
          toast.success("Comment added successfully");
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to add comment");
        },
      },
    );
  };

  // Rendu du texte d'un commentaire avec les mentions mises en évidence
  const renderCommentText = (comment: Comment) => {
    if (!comment.mentions || comment.mentions.length === 0) {
      return <p className="text-sm text-muted-foreground">{comment.text}</p>;
    }

    const sorted = [...comment.mentions].sort((a, b) => a.offset - b.offset);
    const parts: React.ReactNode[] = [];
    let cursor = 0;

    sorted.forEach((mention, i) => {
      if (mention.offset > cursor) {
        parts.push(comment.text.slice(cursor, mention.offset));
      }
      const mentionText = comment.text.slice(
        mention.offset,
        mention.offset + mention.length,
      );
      parts.push(
        <span
          key={`mention-${i}`}
          className="font-medium text-primary bg-primary/10 rounded px-1"
        >
          {mentionText}
        </span>,
      );
      cursor = mention.offset + mention.length;
    });

    if (cursor < comment.text.length) {
      parts.push(comment.text.slice(cursor));
    }

    return <p className="text-sm text-muted-foreground">{parts}</p>;
  };

  if (isLoading)
    return (
      <div>
        <Loader />
      </div>
    );

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Comments</h3>

      <ScrollArea className="h-75 mb-4">
        {comments?.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4 py-2">
              <Avatar className="size-8">
                <AvatarImage src={comment.author.profilePicture} />
                <AvatarFallback>
                  {comment.author?.name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">
                    {comment.author.name}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.createdAt, {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {renderCommentText(comment)}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">No comment yet</p>
          </div>
        )}
      </ScrollArea>

      {canEdit && (
        <>
          <Separator className="my-4" />
          <div className="mt-4 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Add a comment. Use @ to mention someone"
              value={newComment}
              onChange={handleTextChange}
            />

            {mentionQuery !== null && filteredMembers.length > 0 && (
              <div className="absolute z-10 bottom-full mb-1 w-64 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                {filteredMembers.map((member) => (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => handleSelectMention(member)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted",
                    )}
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={member.profilePicture} />
                      <AvatarFallback>
                        {member.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    {member.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button
                disabled={!newComment.trim() || isPending}
                onClick={handleAddComment}
              >
                Post Comment
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
