"use client";

import { useEffect, useState } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface WhiteboardViewerProps {
  data: any | null;
  className?: string;
}

export default function WhiteboardViewer({
  data,
  className = "",
}: WhiteboardViewerProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Loading whiteboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No whiteboard content yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden border border-gray-200`}>
      <Tldraw
        snapshot={data}
        hideUi={true}
        onMount={(editor) => {
          // Make it read-only
          editor.updateInstanceState({
            isReadonly: true,
            isDebugMode: false,
          });

          // Zoom to fit content
          editor.zoomToFit();
        }}
      />
    </div>
  );
}
