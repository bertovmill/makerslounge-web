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

// Cleaner, more subtle colors
const strengthColors = {
  1: "#94A3B8", // slate-400 - mild
  2: "#3B82F6", // blue-500 - medium
  3: "#F97316", // orange-500 - strong
};

function ConnectionEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style,
  } = props;
  const edgeData = data as unknown as ConnectionEdgeData | undefined;
  const [showTooltip, setShowTooltip] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strength = edgeData?.strength || 2;
  const edgeColor = strengthColors[strength as keyof typeof strengthColors] || strengthColors[2];

  // Truncate reason for display on edge
  const truncatedReason = edgeData?.reason
    ? edgeData.reason.length > 30
      ? edgeData.reason.slice(0, 30) + "..."
      : edgeData.reason
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
          {showTooltip && edgeData?.reason && edgeData.reason.length > 30 && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-3 py-2 rounded-lg text-xs bg-popover border border-border shadow-lg max-w-[250px] z-50"
            >
              {edgeData.reason}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(ConnectionEdge);
