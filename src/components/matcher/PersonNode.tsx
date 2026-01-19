"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface PersonNodeData {
  name: string;
  email?: string;
  project?: string;
  phase?: string;
  skills?: string;
  needsHelp?: string;
  groupIndex: number;
  groupColor: string;
}

const groupColors = [
  "oklch(0.5 0.2 255)",   // blue
  "oklch(0.6 0.15 195)",  // teal
  "oklch(0.7 0.18 50)",   // orange
  "oklch(0.85 0.18 90)",  // yellow
  "oklch(0.55 0.15 280)", // purple
  "oklch(0.6 0.2 150)",   // green
  "oklch(0.65 0.18 340)", // pink
  "oklch(0.7 0.15 30)",   // red-orange
];

export function getGroupColor(index: number): string {
  return groupColors[index % groupColors.length];
}

function PersonNode({ data }: NodeProps<PersonNodeData>) {
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-4 !h-4" />
      <div
        className="person-node glass-card rounded-xl p-3 min-w-[180px] max-w-[220px] cursor-grab active:cursor-grabbing"
        style={{
          borderLeft: `3px solid ${data.groupColor}`,
        }}
      >
        {/* Header with avatar and name */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style={{ background: data.groupColor }}
          >
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="font-medium text-sm truncate">{data.name}</p>
            {data.email && (
              <p className="text-xs text-muted-foreground truncate">{data.email}</p>
            )}
          </div>
        </div>

        {/* Project */}
        {data.project && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {data.project}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          {data.phase && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
              {data.phase}
            </span>
          )}
          {data.skills && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground truncate max-w-[100px]">
              {data.skills.split(",")[0]?.trim()}
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-4 !h-4" />
    </>
  );
}

export default memo(PersonNode);
