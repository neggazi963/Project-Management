import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { useUpdateProjectObjectiveMutation } from "@/hooks/use-project";
import { toast } from "sonner";
import type { Project, SmartObjective } from "@/types";

interface ObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

const FIELDS: {
  key: keyof SmartObjective;
  label: string;
  question: string;
}[] = [
  {
    key: "specific",
    label: "Specific",
    question: "What exactly do you want to accomplish, and why does it matter?",
  },
  {
    key: "measurable",
    label: "Measurable",
    question: "How will you know it's done? What number or signal proves it?",
  },
  {
    key: "achievable",
    label: "Achievable",
    question: "How will you get there with the resources you have?",
  },
  {
    key: "relevant",
    label: "Relevant",
    question: "Why does this matter right now, for this team?",
  },
];

export const ObjectiveDialog = ({
  open,
  onOpenChange,
  project,
}: ObjectiveDialogProps) => {
  const [values, setValues] = useState<SmartObjective>(
    project.smartObjective || {},
  );

  useEffect(() => {
    setValues(project.smartObjective || {});
  }, [project.smartObjective, open]);

  const { mutate: updateObjective, isPending } =
    useUpdateProjectObjectiveMutation();

  const handleSave = () => {
    updateObjective(
      { projectId: project._id, ...values },
      {
        onSuccess: () => {
          toast.success("Objective updated");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to update objective"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>SMART Objective</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-2">
          The "Time-bound" part reuses this project's due date — set it from the
          Edit dialog if you need to change it.
        </p>

        <div className="space-y-4">
          {FIELDS.map((field) => (
            <Field key={field.key}>
              <FieldLabel>{field.label}</FieldLabel>
              <p className="text-xs text-muted-foreground mb-1">
                {field.question}
              </p>
              <Textarea
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                rows={2}
              />
            </Field>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Objective"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
