"use client";

import { useEffect, useCallback, useState } from "react";
import { Tldraw, useEditor } from "tldraw";
import "tldraw/tldraw.css";

interface WhiteboardEditorProps {
  initialData: any | null;
  onSave: (data: any) => Promise<void>;
  className?: string;
}

// Component to handle auto-save
function AutoSaveHandler({ onSave }: { onSave: (data: any) => void }) {
  const editor = useEditor();
  const [lastSaved, setLastSaved] = useState<number>(0);

  useEffect(() => {
    // Auto-save every 3 seconds if there are changes
    const interval = setInterval(() => {
      if (editor) {
        const snapshot = editor.getSnapshot();
        const now = Date.now();

        // Only save if more than 3 seconds have passed since last save
        if (now - lastSaved > 3000) {
          onSave(snapshot);
          setLastSaved(now);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [editor, onSave, lastSaved]);

  return null;
}

export default function WhiteboardEditor({
  initialData,
  onSave,
  className = "",
}: WhiteboardEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSave = useCallback((data: any) => {
    onSave(data);
  }, [onSave]);

  if (!isMounted) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Loading whiteboard...</p>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden border border-gray-200`}>
      <Tldraw
        snapshot={initialData || undefined}
        onMount={(editor) => {
          // Optional: Customize editor settings here
          editor.updateInstanceState({ isDebugMode: false });
        }}
      >
        <AutoSaveHandler onSave={handleSave} />
      </Tldraw>
    </div>
  );
}
