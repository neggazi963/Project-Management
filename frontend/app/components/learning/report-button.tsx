import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { useReportContentMutation } from "@/hooks/use-learning";
import { toast } from "sonner";
import { Flag } from "lucide-react";

interface ReportButtonProps {
  targetType: "path" | "note" | "domain";
  targetId: string;
}

const REASONS = [
  { value: "inaccurate", label: "Factually inaccurate" },
  { value: "spam", label: "Spam or low quality" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "duplicate", label: "Duplicate content" },
  { value: "other", label: "Other" },
];

export const ReportButton = ({ targetType, targetId }: ReportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("inaccurate");
  const [details, setDetails] = useState("");
  const { mutate: report, isPending } = useReportContentMutation();

  const handleSubmit = () => {
    report(
      { targetType, targetId, reason, details },
      {
        onSuccess: () => {
          toast.success(
            "Report submitted. Thanks for helping improve quality.",
          );
          setOpen(false);
          setDetails("");
        },
        onError: () => toast.error("Failed to submit report"),
      },
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        <Flag className="size-3" />
        Report
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Report content</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Field>
              <FieldLabel>Reason</FieldLabel>
              <Select
                value={reason}
                onValueChange={(val) => setReason(val ?? "inaccurate")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Details (optional)</FieldLabel>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Add any context that could help review this"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
