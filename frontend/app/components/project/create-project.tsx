import { projectSchema } from "@/lib/schema";
import { ProjectStatus, type MemberProps } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { UseCreateProject } from "@/hooks/use-project";
import { toast } from "sonner";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceMembers: MemberProps[];
}

export type CreateProjectFormData = z.infer<typeof projectSchema>;

export const CreateProjectDialog = ({
  isOpen,
  onOpenChange,
  workspaceId,
  workspaceMembers,
}: CreateProjectDialogProps) => {
  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      status: ProjectStatus.PLANNING,
      startDate: "",
      dueDate: "",
      members: [],
      tags: "",
    },
  });
  const { mutate, isPending } = UseCreateProject();

  const onSubmit = (values: CreateProjectFormData) => {
    if (!workspaceId) return;

    mutate(
      {
        projectData: values,
        workspaceId,
      },
      {
        onSuccess: () => {
          toast.success("Project created successfully");
          form.reset();
          onOpenChange(false);
        },
        onError: (error: any) => {
          const errorMessage = error.response.data.message;
          toast.error(errorMessage);
          console.log(error);
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-135">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a new project to get started
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            control={form.control}
            name="title"
            render={({ field }) => (
              <Field data-invalid={!!form.formState.errors.title}>
                <FieldLabel>Project Title</FieldLabel>
                <Input {...field} placeholder="Project Title" />
                <FieldError
                  errors={
                    form.formState.errors.title
                      ? [form.formState.errors.title]
                      : undefined
                  }
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="description"
            render={({ field }) => (
              <Field data-invalid={!!form.formState.errors.description}>
                <FieldLabel>Project Description</FieldLabel>
                <Textarea
                  {...field}
                  placeholder="Project Description"
                  rows={3}
                />
                <FieldError
                  errors={
                    form.formState.errors.description
                      ? [form.formState.errors.description]
                      : undefined
                  }
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Field data-invalid={!!form.formState.errors.status}>
                <FieldLabel>Project Status</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Project Status" />
                  </SelectTrigger>

                  <SelectContent>
                    {Object.values(ProjectStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError
                  errors={
                    form.formState.errors.status
                      ? [form.formState.errors.status]
                      : undefined
                  }
                />
              </Field>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <Field data-invalid={!!form.formState.errors.startDate}>
                  <FieldLabel>Start Date</FieldLabel>
                  <Popover modal={true}>
                    <PopoverTrigger>
                      
                        <Button
                          variant={"outline"}
                          className={
                            "w-full justify-start text-left font-normal" +
                            (!field.value ? "text-muted-foreground" : "")
                          }
                        >
                          <CalendarIcon className="size-4 mr-2" />
                          {field.value ? (
                            format(new Date(field.value), "PPPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      
                    </PopoverTrigger>

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
                  <FieldError
                    errors={
                      form.formState.errors.startDate
                        ? [form.formState.errors.startDate]
                        : undefined
                    }
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <Field data-invalid={!!form.formState.errors.dueDate}>
                  <FieldLabel>Due Date</FieldLabel>
                  <Popover modal={true}>
                    <PopoverTrigger>
                     
                        <Button
                          variant={"outline"}
                          className={
                            "w-full justify-start text-left font-normal" +
                            (!field.value ? "text-muted-foreground" : "")
                          }
                        >
                          <CalendarIcon className="size-4 mr-2" />
                          {field.value ? (
                            format(new Date(field.value), "PPPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      
                    </PopoverTrigger>

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
                  <FieldError
                    errors={
                      form.formState.errors.dueDate
                        ? [form.formState.errors.dueDate]
                        : undefined
                    }
                  />
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="tags"
            render={({ field }) => (
              <Field data-invalid={!!form.formState.errors.tags}>
                <FieldLabel>Tags</FieldLabel>
                <Input {...field} placeholder="Tags separated by comma" />
                <FieldError
                  errors={
                    form.formState.errors.tags
                      ? [form.formState.errors.tags as any]
                      : undefined
                  }
                />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="members"
            render={({ field }) => {
              const selectedMembers = field.value || [];

              return (
                <Field data-invalid={!!form.formState.errors.members}>
                  <FieldLabel>Members</FieldLabel>
                  <Popover>
                    <PopoverTrigger>
                      
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal min-h-11"
                        >
                          {selectedMembers.length === 0 ? (
                            <span className="text-muted-foreground">
                              Select Members
                            </span>
                          ) : selectedMembers.length <= 2 ? (
                            selectedMembers.map((m) => {
                              const member = workspaceMembers.find(
                                (wm) => wm.user._id === m.user,
                              );

                              return `${member?.user.name} (${member?.role})`;
                            })
                          ) : (
                            `${selectedMembers.length} members selected`
                          )}
                        </Button>
                      
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full max-w-60 overflow-y-auto"
                      align="start"
                    >
                      <div className="flex flex-col gap-2">
                        {workspaceMembers.map((member) => {
                          const selectedMember = selectedMembers.find(
                            (m) => m.user === member.user._id,
                          );

                          return (
                            <div
                              key={member._id}
                              className="flex items-center gap-2 p-2 border rounded"
                            >
                              <Checkbox
                                checked={!!selectedMember}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([
                                      ...selectedMembers,
                                      {
                                        user: member.user._id,
                                        role: "contributor",
                                      },
                                    ]);
                                  } else {
                                    field.onChange(
                                      selectedMembers.filter(
                                        (m) => m.user !== member.user._id,
                                      ),
                                    );
                                  }
                                }}
                                id={`member-${member.user._id}`}
                              />
                              <span className="truncate flex-1">
                                {member.user.name}
                              </span>

                              {selectedMember && (
                                <Select
                                  value={selectedMember.role}
                                  onValueChange={(role) => {
                                    field.onChange(
                                      selectedMembers.map((m) =>
                                        m.user === member.user._id
                                          ? {
                                              ...m,
                                              role: role as
                                                | "contributor"
                                                | "manager"
                                                | "viewer",
                                            }
                                          : m,
                                      ),
                                    );
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="manager">
                                      Manager
                                    </SelectItem>
                                    <SelectItem value="contributor">
                                      Contributor
                                    </SelectItem>
                                    <SelectItem value="viewer">
                                      Viewer
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FieldError
                    errors={
                      form.formState.errors.members
                        ? [form.formState.errors.members as any]
                        : undefined
                    }
                  />
                </Field>
              );
            }}
          />

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
