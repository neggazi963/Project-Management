import { useParams, Link, useSearchParams } from "react-router";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { NoteGraph } from "@/components/learning/note-graph";
import { useGetPathGraphQuery, useGetPathQuery } from "@/hooks/use-learning";
import { ChevronLeft } from "lucide-react";
import type { LearningGraph, LearningPath } from "@/types";

const PathGraph = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const [searchParams] = useSearchParams();
  const currentNoteId = searchParams.get("note") || undefined;

  const { data: pathData, isLoading: isLoadingPath } = useGetPathQuery(
    pathId!,
  ) as { data: { path: LearningPath } | undefined; isLoading: boolean };

  const { data: graph, isLoading: isLoadingGraph } = useGetPathGraphQuery(
    pathId!,
  ) as { data: LearningGraph | undefined; isLoading: boolean };

  if (isLoadingPath || isLoadingGraph || !graph || !pathData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to={`/learning/paths/${pathId}`}>
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ChevronLeft className="size-4 mr-2" />
              Back to Path
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{pathData.path.title}</h1>
          <p className="text-sm text-muted-foreground">
            Note graph — {graph.nodes.length} notes, {graph.edges.length} links
          </p>
        </div>
      </div>

      <NoteGraph graph={graph} pathId={pathId!} currentNoteId={currentNoteId} />

      <p className="text-xs text-muted-foreground">
        Click a node to jump to that note. Orange = current note, blue =
        published, grey = draft (visible to you only).
      </p>
    </div>
  );
};

export default PathGraph;
