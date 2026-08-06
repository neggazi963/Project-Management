import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateProjectMutation } from "@/hooks/use-project";
import { toast } from "sonner";
import type { Project } from "@/types";
import { format } from "date-fns";
import type { CreateProjectFormData } from "./create-project";

const editProjectSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

// Adapte ces valeurs à ton enum réel de statut de projet
const PROJECT_STATUSES = [
  "Planning",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
];

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export const EditProjectDialog = ({
  open,
  onOpenChange,
  project,
}: EditProjectDialogProps) => {
  const { mutate: updateProject, isPending } = useUpdateProjectMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      title: project.title,
      description: project.description ?? "",
      status: project.status ?? "",
      startDate: project.startDate
        ? format(new Date(project.startDate), "yyyy-MM-dd")
        : "",
      dueDate: project.dueDate
        ? format(new Date(project.dueDate), "yyyy-MM-dd")
        : "",
    },
  });

  // Resync si le projet change (ex: navigation entre projets)
  useEffect(() => {
    reset({
      title: project.title,
      description: project.description ?? "",
      status: project.status ?? "",
      startDate: project.startDate
        ? format(new Date(project.startDate), "yyyy-MM-dd")
        : "",
      dueDate: project.dueDate
        ? format(new Date(project.dueDate), "yyyy-MM-dd")
        : "",
    });
  }, [project, reset]);

  const onSubmit = (values: EditProjectFormValues) => {
    updateProject(
      { projectId: project._id, projectData: values as CreateProjectFormData },
      {
        onSuccess: () => {
          toast.success("Projet mis à jour");
          onOpenChange(false);
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.error || "Échec de la mise à jour du projet";
          toast.error(errorMessage);
        },
      },
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>update project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input id="title" {...field} />
                {errors.title && (
                  <FieldError>{errors.title.message}</FieldError>
                )}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea id="description" rows={3} {...field} />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Field>
                <FieldLabel>Statut</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="startDate">start date</FieldLabel>
                  <Input id="startDate" type="date" {...field} />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="dueDate"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="dueDate">due date</FieldLabel>
                  <Input id="dueDate" type="date" {...field} />
                </Field>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
