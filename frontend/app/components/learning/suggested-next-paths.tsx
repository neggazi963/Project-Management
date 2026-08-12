import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetSuggestedNextPathsQuery } from "@/hooks/use-learning";
import { ArrowRight, Star } from "lucide-react";
import type { SuggestedPath } from "@/types";

export const SuggestedNextPaths = ({ pathId }: { pathId: string }) => {
  const { data: suggestions, isLoading } = useGetSuggestedNextPathsQuery(
    pathId,
    true,
  ) as { data: SuggestedPath[] | undefined; isLoading: boolean };

  if (isLoading || !suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        What to learn next
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {suggestions.map((path) => (
          <Link key={path._id} to={`/learning/paths/${path._id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <Badge variant="outline" className="text-xs capitalize mb-1">
                    {path.difficulty}
                  </Badge>
                  <p className="font-medium text-sm truncate">{path.title}</p>
                  {path.stats.averageRating > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {path.stats.averageRating.toFixed(1)}
                    </div>
                  )}
                </div>
                <ArrowRight className="size-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
