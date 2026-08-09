import type { TaskStatus } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useUpdateTaskStatusMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskStatusSelector = ({
  status,
  taskId,
  canEdit = true,
}: {
  status: TaskStatus;
  taskId: string;
  canEdit?: boolean;
}) => {
  const { mutate, isPending } = useUpdateTaskStatusMutation();

  const handleStatusChange = (value: string | null) => {
    if (!value) return;

    mutate(
      { taskId, status: value as TaskStatus },
      {
        onSuccess: () => toast.success("Status updated successfully"),
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
      value={status || ""}
      onValueChange={(value) => handleStatusChange(value)}
      disabled={!canEdit}
    >
      <SelectTrigger className="w-45" disabled={isPending || !canEdit}>
        <SelectValue placeholder="Status" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="To Do">To Do</SelectItem>
        <SelectItem value="In Progress">In Progress</SelectItem>
        <SelectItem value="Done">Done</SelectItem>
      </SelectContent>
    </Select>
  );
};
