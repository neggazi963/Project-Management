import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUpdateNoteMutation,
  useCreateNoteMutation,
  useGetDomainNotesForLinkingQuery,
} from "@/hooks/use-learning";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { LearningNote, DomainNoteForLinking } from "@/types";

interface NoteEditorPanelProps {
  pathId: string;
  domainId: string;
  note: LearningNote | null; // null = nouvelle note
  onClose: () => void;
  onSaved: () => void;
}

export const NoteEditorPanel = ({
  pathId,
  domainId,
  note,
  onClose,
  onSaved,
}: NoteEditorPanelProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [status, setStatus] = useState<"draft" | "published">(
    note?.status || "draft",
  );
  const [relatedIds, setRelatedIds] = useState<string[]>(
    (note?.relatedNotes || []).map((n) => n._id),
  );

  const { mutate: createNote, isPending: isCreating } = useCreateNoteMutation();
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNoteMutation();

  const { data: domainNotes } = useGetDomainNotesForLinkingQuery(domainId) as {
    data: DomainNoteForLinking[] | undefined;
  };

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setStatus(note?.status || "draft");
    setRelatedIds((note?.relatedNotes || []).map((n) => n._id));
  }, [note]);

  const isPending = isCreating || isUpdating;

  // On exclut la note courante elle-même du choix possible
  const candidates = (domainNotes || []).filter((n) => n._id !== note?._id);

  const toggleRelated = (id: string) => {
    setRelatedIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!content.trim()) {
      toast.error("Please add some content");
      return;
    }

    if (note) {
      updateNote(
        {
          noteId: note._id,
          pathId,
          title,
          content,
          status,
          relatedNotes: relatedIds,
        },
        {
          onSuccess: () => {
            toast.success("Note saved");
            onSaved();
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to save note");
          },
        },
      );
    } else {
      createNote(
        { pathId, title, content, relatedNotes: relatedIds },
        {
          onSuccess: () => {
            toast.success("Note created");
            onSaved();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to create note",
            );
          },
        },
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{note ? "Edit Note" : "New Note"}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <Field>
        <FieldLabel>Title</FieldLabel>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Introduction to Variables"
        />
      </Field>

      <p className="text-xs text-muted-foreground">
        Use <code>[[Note Title]]</code> to link to another note in this path.
      </p>

      <div data-color-mode="light">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val || "")}
          height={400}
          preview="live"
        />
      </div>

      {/* Notes liées, potentiellement dans d'autres paths du même domaine */}
      <Field>
        <FieldLabel>Related Notes (other paths)</FieldLabel>
        <p className="text-xs text-muted-foreground mb-2">
          Link this note to related notes elsewhere in the domain — shown as
          "See also" and connected in the domain graph.
        </p>

        {relatedIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {relatedIds.map((id) => {
              const n = candidates.find((c) => c._id === id);
              if (!n) return null;
              return (
                <Badge key={id} variant="outline" className="gap-1 pr-1">
                  {n.title}
                  <span className="text-muted-foreground">({n.pathTitle})</span>
                  <button
                    type="button"
                    onClick={() => toggleRelated(id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {candidates.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No other published notes in this domain yet.
          </p>
        ) : (
          <Select value="" onValueChange={(val) => val && toggleRelated(val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add a related note..." />
            </SelectTrigger>
            <SelectContent>
              {candidates
                .filter((n) => !relatedIds.includes(n._id))
                .map((n) => (
                  <SelectItem key={n._id} value={n._id}>
                    {n.title} — {n.pathTitle}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      {note && (
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select
            value={status}
            onValueChange={(v) =>
              setStatus((v as "draft" | "published") || "draft")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Note"}
        </Button>
      </div>
    </div>
  );
};
