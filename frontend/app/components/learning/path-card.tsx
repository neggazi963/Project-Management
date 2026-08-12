import { Link } from "react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearningPath } from "@/types";

const difficultyColor: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-600 border-green-500/20",
  intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  advanced: "bg-red-500/10 text-red-600 border-red-500/20",
};

export const PathCard = ({ path }: { path: LearningPath }) => {
  const domain = typeof path.domain !== "string" ? path.domain : null;
  const creator = typeof path.createdBy !== "string" ? path.createdBy : null;
  const noteCount = Array.isArray(path.noteOrder) ? path.noteOrder.length : 0;

  return (
    <Link to={`/learning/paths/${path._id}`}>
      <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            {domain && (
              <Badge variant="outline" className="text-xs">
                {domain.name}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-xs capitalize",
                difficultyColor[path.difficulty],
              )}
            >
              {path.difficulty}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg line-clamp-2">{path.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {path.description || "No description"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-medium">
              {path.stats.averageRating > 0
                ? path.stats.averageRating.toFixed(1)
                : "New"}
            </span>
            {path.stats.ratingCount > 0 && (
              <span className="text-muted-foreground">
                ({path.stats.ratingCount})
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{noteCount} notes</span>
            <div className="flex items-center gap-1">
              <Users className="size-3" />
              {path.stats.enrolledCount}
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              {path.stats.completionCount}
            </div>
          </div>

          {creator && (
            <p className="text-xs text-muted-foreground pt-1 border-t">
              by {creator.name}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
