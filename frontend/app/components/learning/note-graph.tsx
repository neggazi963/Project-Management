import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { LearningGraph, GraphNode, GraphEdge } from "@/types";

interface NoteGraphProps {
  graph: LearningGraph;
  pathId: string;
  currentNoteId?: string;
}

const STATUS_COLOR: Record<string, string> = {
  published: "#3b82f6",
  draft: "#94a3b8",
};

export const NoteGraph = ({ graph, pathId, currentNoteId }: NoteGraphProps) => {
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
          height: Math.max(400, entry.contentRect.width * 0.6),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = {
    nodes: graph.nodes.map((n) => ({ ...n })),
    links: graph.edges.map((e) => ({ ...e })),
  };

  if (!ForceGraph2D) {
    return (
      <div
        ref={containerRef}
        className="h-125 flex items-center justify-center border rounded-lg bg-card"
      >
        <p className="text-sm text-muted-foreground">Loading graph...</p>
      </div>
    );
  }

  if (graph.nodes.length === 0) {
    return (
      <div className="h-75 flex items-center justify-center border rounded-lg bg-card">
        <p className="text-sm text-muted-foreground">
          No notes to display yet.
        </p>
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
        dagLevelDistance={80}
        nodeLabel="title"
        nodeColor={(node: GraphNode) =>
          node.id === currentNoteId
            ? "#f59e0b"
            : STATUS_COLOR[node.status] || "#94a3b8"
        }
        nodeRelSize={5}
        linkColor={(link: GraphEdge) =>
          link.type === "wikilink" ? "#3b82f6" : "#cbd5e1"
        }
        linkWidth={(link: GraphEdge) => (link.type === "wikilink" ? 1.5 : 1)}
        linkLineDash={(link: GraphEdge) =>
          link.type === "sequence" ? [] : [4, 2]
        }
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node: GraphNode) => {
          navigate(`/learning/paths/${pathId}?note=${node.id}`);
        }}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(
          node: any,
          ctx: CanvasRenderingContext2D,
          globalScale: number,
        ) => {
          const label = node.title;
          const fontSize = 11 / globalScale;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#64748b";
          ctx.fillText(label, node.x, node.y + 7);
        }}
        cooldownTicks={100}
      />
    </div>
  );
};
