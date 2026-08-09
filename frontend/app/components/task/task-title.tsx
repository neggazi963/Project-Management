import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Edit } from "lucide-react";
import { useUpdateTaskTitleMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskTitle = ({
  title,
  taskId,
  canEdit = true,
}: {
  title: string;
  taskId: string;
  canEdit?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const { mutate, isPending } = useUpdateTaskTitleMutation();
  const updateTitle = () => {
    mutate(
      { taskId, title: newTitle },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Title updated successfully");
        },
        onError: (error: any) => {
          const errorMessage = error.response.data.message;
          toast.error(errorMessage);
          console.log(error);
        },
      },
    );
  };

  if (isEditing && canEdit) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
        <Input
          className="text-xl! font-semibold w-full"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={isPending}
          autoFocus
        />
        <Button
          className="py-0 shrink-0"
          size="sm"
          onClick={updateTitle}
          disabled={isPending}
        >
          Save
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <h2 className="text-xl flex-1 font-semibold wrap-break-word">{title}</h2>
      {canEdit && (
        <Edit
          className="size-3 cursor-pointer shrink-0"
          onClick={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};
