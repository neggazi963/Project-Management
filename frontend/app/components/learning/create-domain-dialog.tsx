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
import {
  useCreateDomainMutation,
  useCheckSimilarDomainsQuery,
} from "@/hooks/use-learning";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import type { LearningDomain } from "@/types";

interface CreateDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateDomainDialog = ({
  open,
  onOpenChange,
}: CreateDomainDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const debouncedName = useDebouncedValue(name, 400);

  const { mutate: createDomain, isPending } = useCreateDomainMutation();
  const { data: similarDomains } = useCheckSimilarDomainsQuery(
    debouncedName,
  ) as { data: LearningDomain[] | undefined };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a domain name");
      return;
    }

    createDomain(
      { name, description },
      {
        onSuccess: () => {
          toast.success("Domain created");
          setName("");
          setDescription("");
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to create domain",
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new Domain</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel>Domain name</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cybersecurity"
            />
          </Field>

          {similarDomains && similarDomains.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="font-medium mb-1">
                  Similar domains already exist:
                </p>
                <ul className="list-disc list-inside">
                  {similarDomains.map((d) => (
                    <li key={d._id}>{d.name}</li>
                  ))}
                </ul>
                <p className="mt-1">
                  Consider using an existing domain instead of creating a
                  duplicate.
                </p>
              </div>
            </div>
          )}

          <Field>
            <FieldLabel>Description (optional)</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What kind of content belongs here?"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending ? "Creating..." : "Create Domain"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
