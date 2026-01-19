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
  isRecommended?: boolean;
  recommendationStrength?: number; // 1-3
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

// Glow color for recommendations
const RECOMMEND_COLOR = "#10B981"; // emerald-500

function PersonNode(props: NodeProps) {
  const data = props.data as unknown as PersonNodeData;
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isRecommended = data.isRecommended || false;
  const strength = data.recommendationStrength || 2;

  const cardBgColor = isRecommended
    ? getLightTint(RECOMMEND_COLOR, 0.15)
    : getLightTint(data.groupColor, 0.12);
  const borderColor = isRecommended
    ? RECOMMEND_COLOR
    : getLightTint(data.groupColor, 0.25);

  // Glow intensity based on recommendation strength
  const glowSize = strength === 3 ? 20 : strength === 2 ? 12 : 8;
  const glowStyle = isRecommended
    ? {
        boxShadow: `0 0 ${glowSize}px ${RECOMMEND_COLOR}60, 0 0 ${glowSize * 2}px ${RECOMMEND_COLOR}30`,
      }
    : {};

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-4 !h-4" />
      <div
        className={`person-node rounded-2xl px-4 py-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all min-w-[100px] ${
          isRecommended ? "ring-2 ring-emerald-500 shadow-lg" : "shadow-sm"
        }`}
        style={{
          backgroundColor: cardBgColor,
          borderWidth: isRecommended ? 2 : 1,
          borderStyle: 'solid',
          borderColor: borderColor,
          ...glowStyle,
        }}
      >
        {/* Recommendation badge */}
        {isRecommended && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Vertical layout: avatar on top, name below */}
        <div className="flex flex-col items-center gap-2">
          {/* Colored avatar */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
              isRecommended ? "ring-2 ring-emerald-400 ring-offset-2" : ""
            }`}
            style={{
              background: isRecommended ? RECOMMEND_COLOR : data.groupColor,
            }}
          >
            {initials}
          </div>

          {/* Name only - centered */}
          <p className={`font-medium text-sm text-center leading-tight max-w-[120px] ${
            isRecommended ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-slate-100"
          }`}>
            {data.name}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-4 !h-4" />
    </>
  );
}

export default memo(PersonNode);
