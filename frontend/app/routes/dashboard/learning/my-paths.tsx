import { Link } from "react-router";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useGetMyPathsQuery,
  useDeletePathMutation,
} from "@/hooks/use-learning";
import {
  Plus,
  Star,
  Users,
  CheckCircle2,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { LearningDomain, LearningPath } from "@/types";

const MyPaths = () => {
  const { data: paths, isLoading } = useGetMyPathsQuery() as {
    data: LearningPath[] | undefined;
    isLoading: boolean;
  };
  const { mutate: deletePath } = useDeletePathMutation();

  const handleDelete = (pathId: string, title: string) => {
    const confirmed = window.confirm(
      `Delete "${title}"? All its notes and learner progress will be lost. This cannot be undone.`,
    );
    if (!confirmed) return;

    deletePath(pathId, {
      onSuccess: () => toast.success("Path deleted"),
      onError: () => toast.error("Failed to delete path"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Paths</h1>
          <p className="text-sm text-muted-foreground">
            Manage the learning paths you've created
          </p>
        </div>
        <Link to="/learning/paths/new/edit">
          <Button>
            <Plus className="size-4 mr-2" />
            New Path
          </Button>
        </Link>
      </div>

      {!paths || paths.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">
            You haven't created any paths yet.
          </p>
          <Link to="/learning/paths/new/edit">
            <Button>
              <Plus className="size-4 mr-2" />
              Create your first Path
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {paths.map((path) => {
            const domain = typeof path.domain !== "string" ? path.domain : null;

            return (
              <Card key={path._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {domain && (
                          <Badge variant="outline" className="text-xs">
                            {domain.name}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            path.status === "published"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20",
                          )}
                        >
                          {path.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold truncate">{path.title}</h3>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      {path.stats.averageRating > 0
                        ? path.stats.averageRating.toFixed(1)
                        : "New"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {path.stats.enrolledCount} enrolled
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" />
                      {path.stats.completionCount} completed
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Link
                      to={`/learning/paths/${path._id}/edit`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Pencil className="size-3.5 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    {path.status === "published" && (
                      <Link to={`/learning/paths/${path._id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="size-3.5" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(path._id, path.title)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyPaths;
