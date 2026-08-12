import MDEditor from "@uiw/react-md-editor";
import { Link2 } from "lucide-react";
import type { LearningNote } from "@/types";

interface NoteContentRendererProps {
  content: string;
  linkedNotes: LearningNote["linkedNotes"];
  onNavigateToLinkedNote: (noteId: string) => void;
}

export const NoteContentRenderer = ({
  content,
  linkedNotes,
  onNavigateToLinkedNote,
}: NoteContentRendererProps) => {
  // Remplace la syntaxe [[Titre]] par un marqueur temporaire, rendu en markdown,
  // puis on affiche les liens en dessous — plus simple et fiable qu'un vrai
  // rendu inline cliquable dans le markdown (qui nécessiterait un plugin remark custom).
  const displayContent = content.replace(/\[\[([^\]]+)\]\]/g, "**$1**");

  return (
    <div className="space-y-6">
      <div data-color-mode="light">
        <MDEditor.Markdown source={displayContent} />
      </div>

      {linkedNotes.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Related notes
          </p>
          <div className="flex flex-wrap gap-2">
            {linkedNotes.map((linked) => (
              <button
                key={linked._id}
                onClick={() => onNavigateToLinkedNote(linked._id)}
                className="inline-flex items-center gap-1 text-xs bg-muted hover:bg-muted/70 rounded-full px-3 py-1.5 transition-colors"
              >
                <Link2 className="size-3" />
                {linked.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
