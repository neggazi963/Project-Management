import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateTaskMutation } from "@/hooks/use-task";
import { createTaskSchema } from "@/lib/schema";
import type { ProjectMemberRole, User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectMembers: { user: User; role: ProjectMemberRole }[];
}

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export const CreateTaskDialog = ({
  open,
  onOpenChange,
  projectId,
  projectMembers,
}: CreateTaskDialogProps) => {
  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "To Do",
      priority: "Medium",
      dueDate: "",
      assignees: [],
    },
  });

  const { mutate, isPending } = useCreateTaskMutation();

  const onSubmit = (values: CreateTaskFormData) => {
    mutate(
      {
        projectId,
        taskData: values,
      },
      {
        onSuccess: () => {
          toast.success("Task created successfully");
          form.reset();
          onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              {/* Title */}
              <Controller
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Enter task title"
                      aria-invalid={!!fieldState.error}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Description */}
              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      placeholder="Enter task description"
                      aria-invalid={!!fieldState.error}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                {/* Status */}
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="To Do">To Do</SelectItem>
                          <SelectItem value="In Progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Priority */}
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel htmlFor={field.name}>Priority</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Due Date */}
              <Controller
                control={form.control}
                name="dueDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor={field.name}>Due Date</FieldLabel>
                    <Popover modal={true}>
                      <PopoverTrigger
                        render={
                          <Button
                            id={field.name}
                            type="button"
                            variant={"outline"}
                            className={
                              "w-full justify-start text-left font-normal" +
                              (!field.value ? " text-muted-foreground" : "")
                            }
                          >
                            <CalendarIcon className="size-4 mr-2" />
                            {field.value ? (
                              format(new Date(field.value), "PPPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        }
                      />

                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            field.onChange(date?.toISOString() || undefined);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Assignees */}
              <Controller
                control={form.control}
                name="assignees"
                render={({ field, fieldState }) => {
                  const selectedMembers = field.value || [];

                  return (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel htmlFor={field.name}>Assignees</FieldLabel>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              id={field.name}
                              type="button"
                              variant="outline"
                              className="w-full justify-start text-left font-normal min-h-11"
                            >
                              {selectedMembers.length === 0 ? (
                                <span className="text-muted-foreground">
                                  Select assignees
                                </span>
                              ) : selectedMembers.length <= 2 ? (
                                selectedMembers
                                  .map((m: string) => {
                                    const member = projectMembers.find(
                                      (wm) => wm.user._id === m,
                                    );
                                    return `${member?.user.name}`;
                                  })
                                  .join(", ")
                              ) : (
                                `${selectedMembers.length} assignees selected`
                              )}
                            </Button>
                          }
                        />

                        <PopoverContent
                          className="w-sm max-h-60 overflow-y-auto p-2"
                          align="start"
                        >
                          <div className="flex flex-col gap-2">
                            {projectMembers.map((member) => {
                              const selectedMember = selectedMembers.find(
                                (m: string) => m === member.user?._id,
                              );
                              return (
                                <div
                                  key={member.user._id}
                                  className="flex items-center gap-2 p-2 border rounded"
                                >
                                  <Checkbox
                                    checked={!!selectedMember}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([
                                          ...selectedMembers,
                                          member.user._id,
                                        ]);
                                      } else {
                                        field.onChange(
                                          selectedMembers.filter(
                                            (m: string) =>
                                              m !== member.user._id,
                                          ),
                                        );
                                      }
                                    }}
                                    id={`member-${member.user._id}`}
                                  />
                                  <span className="truncate flex-1">
                                    {member.user.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  );
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
