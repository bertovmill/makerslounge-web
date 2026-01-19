"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
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

// All connections are grey, thickness indicates strength
const EDGE_COLOR = "#94A3B8"; // slate-400

// Stroke widths based on connection strength
const strengthWidths = {
  1: 1.5,   // mild
  2: 3,     // medium
  3: 5,     // strong
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
  const [showDetails, setShowDetails] = useState(false);

  // Drag state for the popup
  const [popupOffset, setPopupOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - popupOffset.x, y: e.clientY - popupOffset.y };
  }, [popupOffset]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPopupOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

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

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: EDGE_COLOR,
          strokeWidth,
          strokeOpacity: 0.7,
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
            onClick={() => setShowDetails(!showDetails)}
            className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md hover:scale-110 transition-all cursor-pointer"
            style={{ borderColor: EDGE_COLOR }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke={EDGE_COLOR}
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

          {/* Detailed explanation popup */}
          {showDetails && edgeData?.reason && (
            <div
              ref={popupRef}
              className="absolute top-full left-1/2 mt-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl w-[320px] z-50"
              style={{
                transform: `translate(calc(-50% + ${popupOffset.x}px), ${popupOffset.y}px)`,
                cursor: isDragging ? "grabbing" : "default",
              }}
            >
              {/* Drag handle */}
              <div
                onMouseDown={handleMouseDown}
                className="absolute top-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing flex items-center justify-center"
              >
                <div className="w-8 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="flex items-start gap-2 mt-3">
                <div
                  className="w-1 h-full rounded-full flex-shrink-0 self-stretch"
                  style={{ background: EDGE_COLOR }}
                />
                <div>
                  <p className="text-slate-600 dark:text-slate-400 leading-snug" style={{ fontSize: 11 }}>
                    {edgeData.reason}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5 text-slate-500" style={{ fontSize: 10 }}>
                    <div
                      className="h-1 rounded-full"
                      style={{
                        background: EDGE_COLOR,
                        width: strength === 3 ? 20 : strength === 2 ? 12 : 6
                      }}
                    />
                    <span>
                      {strength === 3 ? "Strong" : strength === 2 ? "Medium" : "Mild"} connection
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(ConnectionEdge);
