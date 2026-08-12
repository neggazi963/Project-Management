import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearningNote } from "@/types";

interface SortableNoteItemProps {
  note: LearningNote;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableNoteItem = ({
  note,
  onEdit,
  onDelete,
}: SortableNoteItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 border rounded-md bg-card",
        isDragging && "opacity-50",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground"
      >
        <GripVertical className="size-4" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{note.title}</p>
      </div>

      <Badge
        variant="outline"
        className={cn(
          "text-xs",
          note.status === "published"
            ? "bg-green-500/10 text-green-600 border-green-500/20"
            : "bg-amber-500/10 text-amber-600 border-amber-500/20",
        )}
      >
        {note.status}
      </Badge>

      <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
        <Pencil className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
};

interface NoteOrderListProps {
  notes: LearningNote[];
  onReorder: (noteIds: string[]) => void;
  onEditNote: (note: LearningNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export const NoteOrderList = ({
  notes,
  onReorder,
  onEditNote,
  onDeleteNote,
}: NoteOrderListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = notes.findIndex((n) => n._id === active.id);
    const newIndex = notes.findIndex((n) => n._id === over.id);
    const reordered = arrayMove(notes, oldIndex, newIndex);

    onReorder(reordered.map((n) => n._id));
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed rounded-lg text-sm text-muted-foreground">
        No notes yet. Add your first note to get started.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={notes.map((n) => n._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {notes.map((note) => (
            <SortableNoteItem
              key={note._id}
              note={note}
              onEdit={() => onEditNote(note)}
              onDelete={() => onDeleteNote(note._id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
