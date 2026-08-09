import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { useSaveAsTemplateMutation } from "@/hooks/use-template";
import { toast } from "sonner";

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultTitle: string;
}

export const SaveAsTemplateDialog = ({
  open,
  onOpenChange,
  projectId,
  defaultTitle,
}: SaveAsTemplateDialogProps) => {
  const [title, setTitle] = useState(`${defaultTitle} template`);
  const [description, setDescription] = useState("");
  const { mutate, isPending } = useSaveAsTemplateMutation();

  const handleSave = () => {
    mutate(
      { projectId, title, description },
      {
        onSuccess: () => {
          toast.success("Template saved");
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to save template",
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel>Template name</FieldLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Description (optional)</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            All non-archived tasks of this project will be saved as task
            templates (status reset to "To Do").
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !title.trim()}>
            {isPending ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
