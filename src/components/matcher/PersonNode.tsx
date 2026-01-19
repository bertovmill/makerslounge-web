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

// Anthropic-inspired color palette - softer, more muted
const groupColors = [
  "#D97706", // amber
  "#0891B2", // cyan
  "#7C3AED", // violet
  "#059669", // emerald
  "#DC2626", // red
  "#2563EB", // blue
  "#DB2777", // pink
  "#65A30D", // lime
];

export function getGroupColor(index: number): string {
  return groupColors[index % groupColors.length];
}

function PersonNode(props: NodeProps) {
  const data = props.data as unknown as PersonNodeData;
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-4 !h-4" />
      <div className="person-node bg-white dark:bg-slate-900 rounded-2xl px-4 py-4 shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow min-w-[100px]">
        {/* Vertical layout: avatar on top, name below */}
        <div className="flex flex-col items-center gap-2">
          {/* Colored avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm"
            style={{ background: data.groupColor }}
          >
            {initials}
          </div>

          {/* Name only - centered */}
          <p className="font-medium text-sm text-slate-900 dark:text-slate-100 text-center leading-tight max-w-[120px]">
            {data.name}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-4 !h-4" />
    </>
  );
}

export default memo(PersonNode);
