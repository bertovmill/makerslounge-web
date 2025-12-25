"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Tool = "pen" | "arrow" | "rect" | "text";

interface ScreenshotEditorProps {
  screenshot: string;
  onSave: (editedScreenshot: string) => void;
  onCancel: () => void;
}

export default function ScreenshotEditor({
  screenshot,
  onSave,
  onCancel,
}: ScreenshotEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Store the base image and all drawings
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const drawingsRef = useRef<ImageData | null>(null);

  const drawColor = "#ef4444"; // Red color for annotations
  const lineWidth = 3;

  // Initialize canvas with screenshot
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      baseImageRef.current = img;

      // Calculate canvas size to fit in viewport while maintaining aspect ratio
      const maxWidth = window.innerWidth - 80;
      const maxHeight = window.innerHeight - 200;

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
      }

      setCanvasSize({ width, height });
      setImageLoaded(true);
    };
    img.src = screenshot;
  }, [screenshot]);

  // Draw base image when canvas size is set
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !baseImageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(baseImageRef.current, 0, 0, canvasSize.width, canvasSize.height);
  }, [imageLoaded, canvasSize]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const saveDrawingState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    drawingsRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, []);

  const restoreDrawingState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !drawingsRef.current) return;

    ctx.putImageData(drawingsRef.current, 0, 0);
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasCoords(e);

    if (tool === "text") {
      setTextPos(pos);
      setTextInput("");
      return;
    }

    setIsDrawing(true);
    setStartPos(pos);
    saveDrawingState();

    if (tool === "pen") {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [tool, getCanvasCoords, saveDrawingState]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const pos = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    if (tool === "pen") {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === "arrow" || tool === "rect") {
      // Restore previous state and redraw shape preview
      restoreDrawingState();

      ctx.strokeStyle = drawColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      if (tool === "arrow") {
        drawArrow(ctx, startPos.x, startPos.y, pos.x, pos.y);
      } else {
        ctx.strokeRect(
          startPos.x,
          startPos.y,
          pos.x - startPos.x,
          pos.y - startPos.y
        );
      }
    }
  }, [isDrawing, tool, startPos, getCanvasCoords, restoreDrawingState]);

  const handleEnd = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      saveDrawingState();
    }
  }, [isDrawing, saveDrawingState]);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const handleTextSubmit = () => {
    if (!textInput.trim() || !textPos) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = drawColor;
    ctx.fillText(textInput, textPos.x, textPos.y);

    saveDrawingState();
    setTextPos(null);
    setTextInput("");
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !baseImageRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImageRef.current, 0, 0, canvasSize.width, canvasSize.height);
    saveDrawingState();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export as PNG data URL
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    {
      id: "pen",
      label: "Draw",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      id: "arrow",
      label: "Arrow",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      ),
    },
    {
      id: "rect",
      label: "Rectangle",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
        </svg>
      ),
    },
    {
      id: "text",
      label: "Text",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  ];

  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
        <div className="text-white">Loading screenshot...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[60] p-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl p-2 mb-4 flex items-center gap-2">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`p-2 rounded-lg transition-colors ${
              tool === t.id
                ? "bg-red-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={handleClear}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          title="Clear annotations"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative bg-gray-900 rounded-lg overflow-hidden"
        style={{ maxWidth: "100%", maxHeight: "calc(100vh - 200px)" }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="cursor-crosshair touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        {/* Text input overlay */}
        {textPos && (
          <div
            className="absolute"
            style={{ left: textPos.x, top: textPos.y }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTextSubmit();
                if (e.key === "Escape") setTextPos(null);
              }}
              onBlur={handleTextSubmit}
              placeholder="Type text..."
              className="px-2 py-1 text-sm border-2 border-red-500 rounded outline-none min-w-[120px]"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-white hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
