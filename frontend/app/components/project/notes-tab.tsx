import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useGetProjectNotesQuery,
  useUpdateNoteMutation,
} from "@/hooks/use-note";
import { toast } from "sonner";
import { PlusCircle, Trash2, Pencil, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Note } from "@/types";



const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})\S*$/;

const getYoutubeEmbedUrl = (url: string) => {
  const match = url.trim().match(YOUTUBE_REGEX);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}`;
};

// Splits note content into markdown blocks and standalone YouTube link blocks,
// rendering the latter as embedded video players.
const NoteContentView = ({ content }: { content: string }) => {
  const lines = content.split("\n");
  const blocks: { type: "md" | "video"; content: string }[] = [];
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length) {
      blocks.push({ type: "md", content: buffer.join("\n") });
      buffer = [];
    }
  };

  for (const line of lines) {
    const embedUrl = getYoutubeEmbedUrl(line);
    if (embedUrl) {
      flushBuffer();
      blocks.push({ type: "video", content: embedUrl });
    } else {
      buffer.push(line);
    }
  }
  flushBuffer();

  return (
    <div className="space-y-4" data-color-mode="light">
      {blocks.map((block, i) =>
        block.type === "video" ? (
          <div
            key={i}
            className="aspect-video w-full max-w-2xl rounded-lg overflow-hidden border"
          >
            <iframe
              src={block.content}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Embedded video"
            />
          </div>
        ) : (
          <MDEditor.Markdown key={i} source={block.content} />
        ),
      )}
    </div>
  );
};

type ViewState =
  | { mode: "list" }
  | { mode: "view"; note: Note }
  | { mode: "edit"; note: Note | "new" };

interface NotesTabProps {
  projectId: string;
}

export const NotesTab = ({ projectId }: NotesTabProps) => {
  const { data: notes, isLoading } = useGetProjectNotesQuery(projectId) as {
    data: Note[] | undefined;
    isLoading: boolean;
  };
  const { mutate: createNote, isPending: isCreating } = useCreateNoteMutation();
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNoteMutation();
  const { mutate: deleteNote } = useDeleteNoteMutation();

  const [view, setView] = useState<ViewState>({ mode: "list" });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const startNewNote = () => {
    setTitle("");
    setContent("");
    setView({ mode: "edit", note: "new" });
  };

  const startEditNote = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setView({ mode: "edit", note });
  };

  const handleSave = () => {
    if (view.mode !== "edit") return;

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (view.note === "new") {
      createNote(
        { projectId, title, content },
        {
          onSuccess: () => {
            toast.success("Note created");
            setView({ mode: "list" });
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to create note",
            );
          },
        },
      );
    } else {
      updateNote(
        { noteId: view.note._id, projectId, title, content },
        {
          onSuccess: () => {
            toast.success("Note updated");
            setView({ mode: "list" });
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to update note",
            );
          },
        },
      );
    }
  };

  const handleDelete = (noteId: string) => {
    const confirmed = window.confirm(
      "Delete this note? This action cannot be undone.",
    );
    if (!confirmed) return;

    deleteNote(
      { noteId, projectId },
      {
        onSuccess: () => {
          toast.success("Note deleted");
          setView({ mode: "list" });
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to delete note");
        },
      },
    );
  };

  if (isLoading) return <Loader />;

  if (view.mode === "edit") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="text-lg font-medium sm:max-w-md"
          />
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => setView({ mode: "list" })}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Use <code># Title</code> and <code>## Subtitle</code> for headings.
          Paste a YouTube link on its own line to embed a video.
        </p>

        <div data-color-mode="light">
          <MDEditor
            value={content}
            onChange={(val) => setContent(val || "")}
            height={500}
            preview="live"
          />
        </div>
      </div>
    );
  }

  if (view.mode === "view") {
    const note = view.note;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView({ mode: "list" })}
          >
            <ArrowLeft className="size-4 mr-2" /> Back to notes
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEditNote(note)}
            >
              <Pencil className="size-4 mr-2" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(note._id)}
            >
              <Trash2 className="size-4 mr-2" /> Delete
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-bold mb-1">{note.title}</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Updated{" "}
            {formatDistanceToNow(new Date(note.updatedAt), {
              addSuffix: true,
            })}
            {note.createdBy?.name ? ` by ${note.createdBy.name}` : ""}
          </p>

          <NoteContentView content={note.content} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Notes</h3>
        <Button onClick={startNewNote}>
          <PlusCircle className="size-4 mr-2" /> New Note
        </Button>
      </div>

      {!notes || notes.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-12 border rounded-lg">
          No notes yet. Create one to document ideas, meeting notes, or
          resources.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card
              key={note._id}
              className="relative cursor-pointer hover:shadow-md transition-all"
              onClick={() => setView({ mode: "view", note })}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note._id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
              <CardHeader>
                <CardTitle className="pr-8 line-clamp-1">
                  {note.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
                  {note.content || "No content"}
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  Updated{" "}
                  {formatDistanceToNow(new Date(note.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
