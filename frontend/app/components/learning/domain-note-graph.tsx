import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { DomainGraphNode, DomainGraph, GraphEdge } from "@/types";

interface DomainNoteGraphProps {
  graph: DomainGraph;
}

const PALETTE = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const EDGE_COLOR: Record<string, string> = {
  sequence: "#cbd5e1",
  wikilink: "#3b82f6",
  reference: "#a855f7",
};

export const DomainNoteGraph = ({ graph }: DomainNoteGraphProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ForceGraph2D, setForceGraph2D] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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
          height: Math.max(500, entry.contentRect.width * 0.65),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const pathIds = Array.from(new Set(graph.nodes.map((n) => n.pathId)));
  const colorByPathId = new Map(
    pathIds.map((id, i) => [id, PALETTE[i % PALETTE.length]]),
  );

  const graphData = {
    nodes: graph.nodes.map((n) => ({ ...n })),
    links: graph.edges.map((e) => ({ ...e })),
  };

  if (!ForceGraph2D) {
    return (
      <div
        ref={containerRef}
        className="h-150 flex items-center justify-center border rounded-lg bg-card"
      >
        <p className="text-sm text-muted-foreground">Loading graph...</p>
      </div>
    );
  }

  if (graph.nodes.length === 0) {
    return (
      <div className="h-75 flex items-center justify-center border rounded-lg bg-card">
        <p className="text-sm text-muted-foreground">
          No published notes in this domain yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="border rounded-lg overflow-hidden bg-card"
      >
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel={(node: DomainGraphNode) =>
            `${node.title} (${node.pathTitle})`
          }
          nodeColor={(node: DomainGraphNode) =>
            colorByPathId.get(node.pathId) || "#94a3b8"
          }
          nodeRelSize={4}
          linkColor={(link: GraphEdge) => EDGE_COLOR[link.type || "sequence"]}
          linkWidth={(link: GraphEdge) =>
            link.type === "reference" ? 1.5 : link.type === "wikilink" ? 1.3 : 1
          }
          linkLineDash={(link: GraphEdge) =>
            link.type === "sequence" ? [] : [4, 2]
          }
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          onNodeClick={(node: DomainGraphNode) => {
            navigate(`/learning/paths/${node.pathId}?note=${node.id}`);
          }}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          cooldownTicks={150}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-3">
          {pathIds.map((id) => {
            const sample = graph.nodes.find((n) => n.pathId === id);
            return (
              <div key={id} className="flex items-center gap-1.5 text-xs">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colorByPathId.get(id) }}
                />
                <span className="text-muted-foreground">
                  {sample?.pathTitle}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground border-l pl-4">
          <span className="flex items-center gap-1">
            <span className="w-4 h-px bg-slate-300 inline-block" /> sequence
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-px bg-blue-500 inline-block" /> wikilink
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-px bg-purple-500 inline-block" /> reference
          </span>
        </div>
      </div>
    </div>
  );
};
