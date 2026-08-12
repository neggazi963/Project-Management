import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { useGetDomainRoadmapQuery } from "@/hooks/use-learning";
import { ChevronLeft } from "lucide-react";
import type { DomainRoadmap, RoadmapNode } from "@/types";

const STATUS_COLOR: Record<string, string> = {
  completed: "#10b981",
  "in-progress": "#f59e0b",
  "not-started": "#94a3b8",
};

const RoadmapGraph = ({ roadmap }: { roadmap: DomainRoadmap }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ForceGraph2D, setForceGraph2D] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    import("react-force-graph-2d").then((mod) => {
      setForceGraph2D(() => mod.default);
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(400, entry.contentRect.width * 0.55),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = {
    nodes: roadmap.nodes.map((n) => ({ ...n })),
    links: roadmap.edges.map((e) => ({ ...e })),
  };

  if (!ForceGraph2D) {
    return (
      <div
        ref={containerRef}
        className="h-125 flex items-center justify-center border rounded-lg bg-card"
      >
        <p className="text-sm text-muted-foreground">Loading roadmap...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="border rounded-lg overflow-hidden bg-card"
    >
      <ForceGraph2D
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        dagMode="td"
        dagLevelDistance={100}
        nodeLabel={(node: RoadmapNode) => `${node.title} (${node.status})`}
        nodeColor={(node: RoadmapNode) => STATUS_COLOR[node.status]}
        nodeRelSize={7}
        linkColor={() => "#cbd5e1"}
        linkWidth={1.5}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node: RoadmapNode) => {
          navigate(`/learning/paths/${node.id}`);
        }}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(
          node: any,
          ctx: CanvasRenderingContext2D,
          globalScale: number,
        ) => {
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#334155";
          ctx.fillText(node.title, node.x, node.y + 9);
        }}
        cooldownTicks={100}
      />
    </div>
  );
};

const DomainRoadmapPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: roadmap, isLoading } = useGetDomainRoadmapQuery(slug!) as {
    data: DomainRoadmap | undefined;
    isLoading: boolean;
  };

  if (isLoading || !roadmap) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (roadmap.nodes.length === 0) {
    return (
      <div className="space-y-6">
        <Link to={`/learning/domains/${slug}`}>
          <Button variant="ghost" size="sm" className="-ml-2">
            <ChevronLeft className="size-4 mr-2" />
            Back to {roadmap.domain.name}
          </Button>
        </Link>
        <div className="text-center py-16 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            No published paths in this domain yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/learning/domains/${slug}`}>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ChevronLeft className="size-4 mr-2" />
            Back to {roadmap.domain.name}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{roadmap.domain.name} — Roadmap</h1>
        <p className="text-sm text-muted-foreground">
          Suggested learning order based on prerequisites. Click a path to open
          it.
        </p>
      </div>

      <RoadmapGraph roadmap={roadmap} />

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-500" /> Completed
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-500" /> In progress
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-slate-400" /> Not started
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Paths without any prerequisite link are independent — you can start them
        in any order.
      </p>
    </div>
  );
};

export default DomainRoadmapPage;
