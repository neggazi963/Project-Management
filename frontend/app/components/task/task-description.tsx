import { useUpdateTaskDescriptionMutation } from "@/hooks/use-task";
import { Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export const TaskDescription = ({
  description,
  taskId,
  canEdit = true,
}: {
  description: string;
  taskId: string;
  canEdit?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newDescription, setNewDescription] = useState(description);
  const { mutate, isPending } = useUpdateTaskDescriptionMutation();
  const updateDescription = () => {
    mutate(
      { taskId, description: newDescription },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Description updated successfully");
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
      <div className="flex flex-col gap-2 w-full">
        <Textarea
          className="w-full"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          disabled={isPending}
          autoFocus
        />
        <Button
          className="py-0 self-end"
          size="sm"
          onClick={updateDescription}
          disabled={isPending}
        >
          Save
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 w-full">
      <div className="text-sm md:text-base text-pretty flex-1 text-muted-foreground">
        {description || (
          <span className="italic text-muted-foreground/60">
            No description
          </span>
        )}
      </div>
      {canEdit && ( 
        <Edit
          className="size-3 cursor-pointer shrink-0 mt-1"
          onClick={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};
