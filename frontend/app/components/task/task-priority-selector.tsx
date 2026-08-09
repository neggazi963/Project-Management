import type { TaskPriority } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useUpdateTaskPriorityMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskPrioritySelector = ({
  priority,
  taskId,
  canEdit = true,
}: {
  priority: TaskPriority;
  taskId: string;
  canEdit?: boolean;
}) => {
  const { mutate, isPending } = useUpdateTaskPriorityMutation();

  const handleStatusChange = (value: string | null) => {
    if (!value) return;

    mutate(
      { taskId, priority: value as TaskPriority },
      {
        onSuccess: () => {
          toast.success("Priority updated successfully");
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.message ?? "Something went wrong";
          toast.error(errorMessage);
          console.log(error);
        },
      },
    );
  };

  return (
    <Select
      value={priority || ""}
      onValueChange={(value) => handleStatusChange(value)}
      disabled={!canEdit}
    >
      <SelectTrigger className="w-45" disabled={isPending || !canEdit}>
        <SelectValue placeholder="Priority" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="Low">Low</SelectItem>
        <SelectItem value="Medium">Medium</SelectItem>
        <SelectItem value="High">High</SelectItem>
      </SelectContent>
    </Select>
  );
};
