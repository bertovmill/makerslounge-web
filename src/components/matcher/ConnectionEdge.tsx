"use client";

import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export interface ConnectionEdgeData {
  reason: string;
  strength: number; // 1-3, affects color intensity
}

const strengthColors = {
  1: "oklch(0.6 0.15 195)", // teal - mild
  2: "oklch(0.5 0.2 255)",  // blue - medium
  3: "oklch(0.7 0.18 50)",  // orange - strong
};

function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps<ConnectionEdgeData>) {
  const [showTooltip, setShowTooltip] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strength = data?.strength || 2;
  const edgeColor = strengthColors[strength as keyof typeof strengthColors] || strengthColors[2];

  // Truncate reason for display on edge
  const truncatedReason = data?.reason
    ? data.reason.length > 30
      ? data.reason.slice(0, 30) + "..."
      : data.reason
    : "";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: strength === 3 ? 2.5 : strength === 2 ? 2 : 1.5,
          strokeOpacity: 0.6,
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
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* Truncated label */}
          <div
            className="px-2 py-1 rounded text-[10px] bg-background/90 backdrop-blur-sm border border-border shadow-sm max-w-[150px] truncate cursor-default"
            style={{ color: edgeColor }}
          >
            {truncatedReason}
          </div>

          {/* Full tooltip on hover */}
          {showTooltip && data?.reason && data.reason.length > 30 && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-3 py-2 rounded-lg text-xs bg-popover border border-border shadow-lg max-w-[250px] z-50"
            >
              {data.reason}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(ConnectionEdge);
