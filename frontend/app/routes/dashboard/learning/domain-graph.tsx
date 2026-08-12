import { useParams, Link } from "react-router";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { DomainNoteGraph } from "@/components/learning/domain-note-graph";
import { useGetDomainGraphQuery } from "@/hooks/use-learning";
import { ChevronLeft } from "lucide-react";
import type { DomainGraph } from "@/types";

const DomainGraphPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: graph, isLoading } = useGetDomainGraphQuery(slug!) as {
    data: DomainGraph | undefined;
    isLoading: boolean;
  };

  if (isLoading || !graph) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/learning/domains/${slug}`}>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ChevronLeft className="size-4 mr-2" />
            Back to {graph.domain.name}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{graph.domain.name} — Graph</h1>
        <p className="text-sm text-muted-foreground">
          {graph.nodes.length} notes across {graph.pathCount} paths
        </p>
      </div>

      <DomainNoteGraph graph={graph} />

      <p className="text-xs text-muted-foreground">
        Each color is a different path. Notes only link within their own path —
        clusters aren't connected to each other yet.
      </p>
    </div>
  );
};

export default DomainGraphPage;
