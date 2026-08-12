import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import type { LearningNote, LearningProgress } from "@/types";

interface PathProgressSidebarProps {
  notes: LearningNote[];
  progress: LearningProgress | null;
  currentNoteId: string;
  onSelectNote: (noteId: string) => void;
  isOwner: boolean; // le créateur peut naviguer librement, pas verrouillé
}

export const PathProgressSidebar = ({
  notes,
  progress,
  currentNoteId,
  onSelectNote,
  isOwner,
}: PathProgressSidebarProps) => {
  const completedIds = new Set(progress?.completedNotes || []);

  const percentComplete =
    notes.length > 0
      ? Math.round((completedIds.size / notes.length) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">
            {percentComplete}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {notes.map((note, index) => {
          const isCompleted = completedIds.has(note._id);
          const isCurrent = note._id === currentNoteId;
          // Verrouillé si : pas owner, pas complété, pas la note courante,
          // et la note précédente n'est pas encore complétée
          const previousNote = notes[index - 1];
          const isLocked =
            !isOwner &&
            !isCompleted &&
            !isCurrent &&
            previousNote &&
            !completedIds.has(previousNote._id);

          return (
            <button
              key={note._id}
              disabled={isLocked}
              onClick={() => !isLocked && onSelectNote(note._id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors",
                isCurrent && "bg-primary/10 text-primary font-medium",
                !isCurrent && !isLocked && "hover:bg-muted",
                isLocked && "opacity-50 cursor-not-allowed",
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
              ) : isLocked ? (
                <Lock className="size-4 text-muted-foreground shrink-0" />
              ) : (
                <Circle
                  className={cn(
                    "size-4 shrink-0",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                />
              )}
              <span className="truncate">{note.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};