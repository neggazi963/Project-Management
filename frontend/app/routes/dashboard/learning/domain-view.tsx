import { useParams, Link } from "react-router";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { PathCard } from "@/components/learning/path-card";
import { useGetDomainBySlugQuery } from "@/hooks/use-learning";
import { ChevronLeft, Plus, Route, Share2 } from "lucide-react";
import * as Icons from "lucide-react";
import { BookOpen } from "lucide-react";
import type { LearningDomain, LearningPath } from "@/types";

const DomainView = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useGetDomainBySlugQuery(slug!) as {
    data: { domain: LearningDomain; paths: LearningPath[] } | undefined;
    isLoading: boolean;
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  const { domain, paths } = data;
  const IconComponent =
    domain.icon && (Icons as any)[domain.icon]
      ? (Icons as any)[domain.icon]
      : BookOpen;

  return (
    <div className="space-y-8">
      <Link to="/learning" className="inline-block">
        <Button variant="ghost" size="sm">
          <ChevronLeft className="size-4 mr-2" />
          Back to Learning
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <IconComponent className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{domain.name}</h1>
            {domain.description && (
              <p className="text-sm text-muted-foreground">
                {domain.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/learning/domains/${slug}/graph`}>
            <Button variant="outline">
              <Share2 className="size-4 mr-2" />
              View Graph
            </Button>
          </Link>
          <Link to={`/learning/domains/${slug}/roadmap`}>
            <Button variant="outline">
              <Route className="size-4 mr-2" />
              Roadmap
            </Button>
          </Link>
          <Link to="/learning/paths/new/edit">
            <Button variant="outline">
              <Plus className="size-4 mr-2" />
              Create Path in this Domain
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">
          {paths.length} {paths.length === 1 ? "Path" : "Paths"}
        </h2>

        {paths.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              No paths published in this domain yet. Be the first to create one!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((path) => (
              <PathCard key={path._id} path={path} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DomainView;
