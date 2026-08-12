import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NoteOrderList } from "@/components/learning/note-order-list";
import { NoteEditorPanel } from "@/components/learning/note-editor-panel";
import {
  useGetPathForEditingQuery,
  useGetDomainsQuery,
  useCreatePathMutation,
  useUpdatePathMutation,
  useDeleteNoteMutation,
  useReorderNotesMutation,
  useDiscoverPathsQuery,
} from "@/hooks/use-learning";
import { toast } from "sonner";
import { Plus, ExternalLink, X } from "lucide-react";
import type { LearningDomain, LearningNote, LearningPath } from "@/types";

const PathEditor = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const isNew = pathId === "new";

  const { data: path, isLoading } = useGetPathForEditingQuery(pathId!) as {
    data: LearningPath | undefined;
    isLoading: boolean;
  };

  const { data: domains } = useGetDomainsQuery() as {
    data: LearningDomain[] | undefined;
  };

  const { mutate: createPath, isPending: isCreating } = useCreatePathMutation();
  const { mutate: updatePath, isPending: isUpdating } = useUpdatePathMutation();
  const { mutate: deleteNote } = useDeleteNoteMutation();
  const { mutate: reorderNotes } = useReorderNotesMutation();

  // État local pour la création d'un nouveau path (pas encore en DB)
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDomainId, setNewDomainId] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("beginner");

  const [editingNote, setEditingNote] = useState<LearningNote | "new" | null>(
    null,
  );

  // Prérequis : liste des IDs sélectionnés, initialisée dès que `path` arrive
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<string[]>([]);

  const domainId =
    path && typeof path.domain !== "string" ? path.domain._id : "";

  // Candidats possibles : paths publiés du même domaine, hors le path courant
  const { data: domainPaths } = useDiscoverPathsQuery({
    domain: domainId,
  }) as { data: LearningPath[] | undefined };

  useEffect(() => {
    if (path) {
      const ids = (path.prerequisites as any[]).map((p) =>
        typeof p === "string" ? p : p._id,
      );
      setSelectedPrereqIds(ids);
    }
  }, [path]);

  if (!isNew && isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  const handleCreatePath = () => {
    if (!newTitle.trim() || !newDomainId) {
      toast.error("Please fill in the title and domain");
      return;
    }

    createPath(
      {
        domainId: newDomainId,
        title: newTitle,
        description: newDescription,
        difficulty: newDifficulty,
      },
      {
        onSuccess: (data: any) => {
          toast.success("Path created — now add some notes!");
          navigate(`/learning/paths/${data._id}/edit`, { replace: true });
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to create path");
        },
      },
    );
  };

  const handlePublishToggle = () => {
    if (!path) return;
    const newStatus = path.status === "published" ? "draft" : "published";

    updatePath(
      { pathId: path._id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            newStatus === "published" ? "Path published!" : "Path unpublished",
          );
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to update path status",
          );
        },
      },
    );
  };

  const handleDeleteNote = (noteId: string) => {
    const confirmed = window.confirm(
      "Delete this note? This cannot be undone.",
    );
    if (!confirmed) return;

    deleteNote(
      { noteId, pathId: path!._id },
      {
        onSuccess: () => toast.success("Note deleted"),
        onError: () => toast.error("Failed to delete note"),
      },
    );
  };

  const handleReorder = (noteIds: string[]) => {
    reorderNotes({ pathId: path!._id, noteIds });
  };

  const togglePrereq = (id: string) => {
    setSelectedPrereqIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSavePrereqs = () => {
    if (!path) return;
    updatePath(
      { pathId: path._id, prerequisites: selectedPrereqIds },
      {
        onSuccess: () => toast.success("Prerequisites updated"),
        onError: () => toast.error("Failed to update prerequisites"),
      },
    );
  };

  // ===== Écran de création (path pas encore créé) =====
  if (isNew) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Create a Learning Path</h1>

        <Field>
          <FieldLabel>Title</FieldLabel>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Python for Beginners"
          />
        </Field>

        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={3}
            placeholder="What will learners get out of this path?"
          />
        </Field>

        <Field>
          <FieldLabel>Domain</FieldLabel>
          <Select
            value={newDomainId}
            onValueChange={(val) => setNewDomainId(val || "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a domain" />
            </SelectTrigger>
            <SelectContent>
              {domains?.map((d) => (
                <SelectItem key={d._id} value={d._id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(!domains || domains.length === 0) && (
            <p className="text-xs text-muted-foreground mt-1">
              No domains yet — ask an admin to create one, or check back later.
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel>Difficulty</FieldLabel>
          <Select
            value={newDifficulty}
            onValueChange={(val) => setNewDifficulty(val || "beginner")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Button
          onClick={handleCreatePath}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? "Creating..." : "Create Path & Add Notes"}
        </Button>
      </div>
    );
  }

  if (!path) return null;

  const notes = (path.noteOrder as LearningNote[]) || [];
  const publishedCount = notes.filter((n) => n.status === "published").length;

  const prereqCandidates = (domainPaths || []).filter(
    (p) => p._id !== path._id,
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{path.title}</h1>
            <Badge
              variant="outline"
              className={
                path.status === "published"
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }
            >
              {path.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{path.description}</p>
        </div>

        <div className="flex gap-2 shrink-0">
          {path.status === "published" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/learning/paths/${path._id}`)}
            >
              <ExternalLink className="size-4 mr-2" />
              View
            </Button>
          )}
          <Button
            size="sm"
            onClick={handlePublishToggle}
            disabled={
              isUpdating || (path.status === "draft" && publishedCount === 0)
            }
            title={
              path.status === "draft" && publishedCount === 0
                ? "Add at least one published note first"
                : undefined
            }
          >
            {path.status === "published" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Prérequis */}
      <div className="space-y-3">
        <h2 className="font-semibold">Prerequisites</h2>
        <p className="text-xs text-muted-foreground">
          Learners will see these paths suggested before this one, and this path
          will appear as a "next step" after completing them.
        </p>

        {selectedPrereqIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedPrereqIds.map((id) => {
              const p = prereqCandidates.find((c) => c._id === id);
              if (!p) return null;
              return (
                <Badge key={id} variant="outline" className="gap-1 pr-1">
                  {p.title}
                  <button
                    type="button"
                    onClick={() => togglePrereq(id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {prereqCandidates.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No other published paths in this domain yet.
          </p>
        ) : (
          <Select value="" onValueChange={(val) => val && togglePrereq(val)}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Add a prerequisite path..." />
            </SelectTrigger>
            <SelectContent>
              {prereqCandidates
                .filter((p) => !selectedPrereqIds.includes(p._id))
                .map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        <Button size="sm" variant="outline" onClick={handleSavePrereqs}>
          Save Prerequisites
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            Notes ({publishedCount}/{notes.length} published)
          </h2>
          <Button size="sm" onClick={() => setEditingNote("new")}>
            <Plus className="size-4 mr-2" />
            Add Note
          </Button>
        </div>

        <NoteOrderList
          notes={notes}
          onReorder={handleReorder}
          onEditNote={(note) => setEditingNote(note)}
          onDeleteNote={handleDeleteNote}
        />
      </div>

      <Dialog
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingNote && (
            <NoteEditorPanel
              pathId={path._id}
              domainId={domainId}
              note={editingNote === "new" ? null : editingNote}
              onClose={() => setEditingNote(null)}
              onSaved={() => setEditingNote(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PathEditor;
