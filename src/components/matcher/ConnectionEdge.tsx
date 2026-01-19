"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  useReactFlow,
} from "@xyflow/react";

export interface ConnectionEdgeData {
  reason: string;
  strength: number; // 1-3, affects color intensity
  source?: string;
  target?: string;
}

// All connections are grey, thickness indicates strength
export const EDGE_COLOR = "#94A3B8"; // slate-400

// Stroke widths based on connection strength
const strengthWidths = {
  1: 1.5,   // mild
  2: 3,     // medium
  3: 5,     // strong
};

function ConnectionEdge(props: EdgeProps) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style,
    selected,
  } = props;
  const edgeData = data as unknown as ConnectionEdgeData | undefined;
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strength = edgeData?.strength || 2;
  const strokeWidth = strengthWidths[strength as keyof typeof strengthWidths] || strengthWidths[2];

  const handleClick = () => {
    // Toggle selection by updating all edges
    setEdges((edges) =>
      edges.map((edge) => ({
        ...edge,
        selected: edge.id === id ? !edge.selected : false,
      }))
    );
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: selected ? "#3B82F6" : EDGE_COLOR,
          strokeWidth: selected ? strokeWidth + 2 : strokeWidth,
          strokeOpacity: selected ? 1 : 0.7,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="connection-edge-label"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          {/* Info button */}
          <button
            onClick={handleClick}
            className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-sm hover:shadow-md hover:scale-110 transition-all cursor-pointer ${
              selected
                ? "bg-blue-500 border-blue-500"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600"
            }`}
            style={{ borderColor: selected ? "#3B82F6" : EDGE_COLOR }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke={selected ? "white" : EDGE_COLOR}
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(ConnectionEdge);
