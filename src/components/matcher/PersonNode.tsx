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

// Color palette for different groups - each group shares a color
const groupColors = [
  "#7C3AED", // violet
  "#0891B2", // cyan
  "#D97706", // amber
  "#059669", // emerald
  "#DC2626", // red
  "#2563EB", // blue
  "#DB2777", // pink
  "#65A30D", // lime
];

export function getGroupColor(index: number): string {
  return groupColors[index % groupColors.length];
}

// Create a light tint of a hex color (for card backgrounds)
function getLightTint(hex: string, opacity: number = 0.1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function PersonNode(props: NodeProps) {
  const data = props.data as unknown as PersonNodeData;
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const cardBgColor = getLightTint(data.groupColor, 0.12);
  const borderColor = getLightTint(data.groupColor, 0.25);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-4 !h-4" />
      <div
        className="person-node rounded-2xl px-4 py-4 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow min-w-[100px]"
        style={{
          backgroundColor: cardBgColor,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: borderColor,
        }}
      >
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
