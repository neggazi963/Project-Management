import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  useGetWorkspaceTemplatesQuery,
  useCreateProjectFromTemplateMutation,
  useDeleteTemplateMutation,
} from "@/hooks/use-template";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Trash2 } from "lucide-react";
import type { ProjectTemplate } from "@/types";

interface CreateFromTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export const CreateFromTemplateDialog = ({
  open,
  onOpenChange,
  workspaceId,
}: CreateFromTemplateDialogProps) => {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useGetWorkspaceTemplatesQuery(
    workspaceId,
  ) as { data: ProjectTemplate[] | undefined; isLoading: boolean };

  const { mutate: createFromTemplate, isPending } =
    useCreateProjectFromTemplateMutation();
  const { mutate: deleteTemplate } = useDeleteTemplateMutation();

  const [selectedTemplate, setSelectedTemplate] =
    useState<ProjectTemplate | null>(null);
  const [projectTitle, setProjectTitle] = useState("");

  const handleUse = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setProjectTitle(template.title.replace(/ template$/i, ""));
  };

  const handleConfirm = () => {
    if (!selectedTemplate) return;

    createFromTemplate(
      {
        workspaceId,
        templateId: selectedTemplate._id,
        title: projectTitle,
      },
      {
        onSuccess: (data: any) => {
          toast.success("Project created from template");
          onOpenChange(false);
          navigate(`/workspaces/${workspaceId}/projects/${data._id}`);
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to create project",
          );
        },
      },
    );
  };

  const handleDelete = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm("Delete this template?");
    if (!confirmed) return;

    deleteTemplate(
      { templateId, workspaceId },
      {
        onSuccess: () => toast.success("Template deleted"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {selectedTemplate ? "New project details" : "Choose a template"}
          </DialogTitle>
        </DialogHeader>

        {!selectedTemplate ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !templates || templates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No templates yet. Save a project as a template to see it here.
              </p>
            ) : (
              templates.map((template) => (
                <button
                  key={template._id}
                  onClick={() => handleUse(template)}
                  className="w-full flex items-start justify-between gap-2 p-3 border rounded-md text-left hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">{template.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.taskTemplates.length} tasks · by{" "}
                      {template.createdBy?.name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={(e) => handleDelete(template._id, e)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Field>
              <FieldLabel>Project title</FieldLabel>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              {selectedTemplate.taskTemplates.length} tasks will be created
              automatically.
            </p>
          </div>
        )}

        <DialogFooter>
          {selectedTemplate ? (
            <>
              <Button
                variant="outline"
                onClick={() => setSelectedTemplate(null)}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isPending || !projectTitle.trim()}
              >
                {isPending ? "Creating..." : "Create Project"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
