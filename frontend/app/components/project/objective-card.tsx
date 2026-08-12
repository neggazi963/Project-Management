import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import type { Project } from "@/types";

const LABELS: {
  key: keyof NonNullable<Project["smartObjective"]>;
  label: string;
}[] = [
  { key: "specific", label: "Specific" },
  { key: "measurable", label: "Measurable" },
  { key: "achievable", label: "Achievable" },
  { key: "relevant", label: "Relevant" },
];

export const ObjectiveCard = ({ project }: { project: Project }) => {
  const objective = project.smartObjective;
  const filledCount = LABELS.filter((f) => objective?.[f.key]?.trim()).length;
  const totalCriteria = LABELS.length + 1; // +1 pour le due date (time-bound)
  const hasDeadline = !!project.dueDate;
  const completeness = filledCount + (hasDeadline ? 1 : 0);

  if (!objective && !hasDeadline) return null;

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <h3 className="font-semibold text-sm">SMART Objective</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {completeness}/{totalCriteria} defined
          </Badge>
        </div>

        <div className="space-y-2">
          {LABELS.map((field) => {
            const value = objective?.[field.key];
            return (
              <div key={field.key} className="flex gap-2 text-sm">
                {value?.trim() ? (
                  <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-medium">{field.label}:</span>{" "}
                  <span className="text-muted-foreground">
                    {value?.trim() || "Not defined yet"}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="flex gap-2 text-sm">
            {hasDeadline ? (
              <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <Circle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex items-center gap-1">
              <span className="font-medium">Time-bound:</span>{" "}
              {hasDeadline ? (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" />
                  {format(new Date(project.dueDate), "MMM d, yyyy")}
                </span>
              ) : (
                <span className="text-muted-foreground">No due date set</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
