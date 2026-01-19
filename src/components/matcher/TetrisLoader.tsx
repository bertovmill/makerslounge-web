"use client";

import { useEffect, useState, useMemo } from "react";

// Colors for blocks
const COLORS = {
  cyan: { color: "#67D4F1", shadow: "#4BB8D4", highlight: "#8DE4FF" },
  yellow: { color: "#FFD93D", shadow: "#E6C235", highlight: "#FFEB80" },
  purple: { color: "#C77DFF", shadow: "#A855F7", highlight: "#DDA0FF" },
  green: { color: "#7ED957", shadow: "#5CB240", highlight: "#A5F07A" },
  red: { color: "#FF6B6B", shadow: "#E05050", highlight: "#FF9B9B" },
  blue: { color: "#5B7FFF", shadow: "#4361EE", highlight: "#8BA3FF" },
  orange: { color: "#FF9F43", shadow: "#E68A2E", highlight: "#FFBE7A" },
};

type ColorName = keyof typeof COLORS;

// Each state adds new cells to the grid (building up piece by piece)
// Grid is 10 wide x 7 tall (row 0 is top, row 6 is bottom)
const GRID_STATES: { x: number; y: number; color: ColorName }[][] = [
  // State 0: Empty
  [],

  // State 1: I piece (horizontal) at bottom
  [
    { x: 0, y: 6, color: "cyan" },
    { x: 1, y: 6, color: "cyan" },
    { x: 2, y: 6, color: "cyan" },
    { x: 3, y: 6, color: "cyan" },
  ],

  // State 2: Add J piece
  [
    { x: 0, y: 6, color: "cyan" },
    { x: 1, y: 6, color: "cyan" },
    { x: 2, y: 6, color: "cyan" },
    { x: 3, y: 6, color: "cyan" },
    // J piece
    { x: 0, y: 5, color: "blue" },
    { x: 0, y: 4, color: "blue" },
    { x: 0, y: 3, color: "blue" },
    { x: 1, y: 5, color: "blue" },
  ],

  // State 3: Add O piece (yellow square)
  [
    { x: 0, y: 6, color: "cyan" },
    { x: 1, y: 6, color: "cyan" },
    { x: 2, y: 6, color: "cyan" },
    { x: 3, y: 6, color: "cyan" },
    { x: 0, y: 5, color: "blue" },
    { x: 0, y: 4, color: "blue" },
    { x: 0, y: 3, color: "blue" },
    { x: 1, y: 5, color: "blue" },
    // O piece
    { x: 4, y: 6, color: "yellow" },
    { x: 5, y: 6, color: "yellow" },
    { x: 4, y: 5, color: "yellow" },
    { x: 5, y: 5, color: "yellow" },
  ],

  // State 4: Add T piece (purple)
  [
    { x: 0, y: 6, color: "cyan" },
    { x: 1, y: 6, color: "cyan" },
    { x: 2, y: 6, color: "cyan" },
    { x: 3, y: 6, color: "cyan" },
    { x: 0, y: 5, color: "blue" },
    { x: 0, y: 4, color: "blue" },
    { x: 0, y: 3, color: "blue" },
    { x: 1, y: 5, color: "blue" },
    { x: 4, y: 6, color: "yellow" },
    { x: 5, y: 6, color: "yellow" },
    { x: 4, y: 5, color: "yellow" },
    { x: 5, y: 5, color: "yellow" },
    // T piece
    { x: 6, y: 6, color: "purple" },
    { x: 7, y: 6, color: "purple" },
    { x: 8, y: 6, color: "purple" },
    { x: 7, y: 5, color: "purple" },
  ],

  // State 5: Add S piece (green) - positioned to not overlap
  [
    { x: 0, y: 6, color: "cyan" },
    { x: 1, y: 6, color: "cyan" },
    { x: 2, y: 6, color: "cyan" },
    { x: 3, y: 6, color: "cyan" },
    { x: 0, y: 5, color: "blue" },
    { x: 0, y: 4, color: "blue" },
    { x: 0, y: 3, color: "blue" },
    { x: 1, y: 5, color: "blue" },
    { x: 4, y: 6, color: "yellow" },
    { x: 5, y: 6, color: "yellow" },
    { x: 4, y: 5, color: "yellow" },
    { x: 5, y: 5, color: "yellow" },
    { x: 6, y: 6, color: "purple" },
    { x: 7, y: 6, color: "purple" },
    { x: 8, y: 6, color: "purple" },
    { x: 7, y: 5, color: "purple" },
    // S piece - next to blue J piece, not overlapping
    { x: 2, y: 5, color: "green" },
    { x: 3, y: 5, color: "green" },
    { x: 1, y: 4, color: "green" },
    { x: 2, y: 4, color: "green" },
  ],

  // State 6: Add Z piece (red)
  [
    { x: 0, y: 6, color: "cyan" },
    { x: 1, y: 6, color: "cyan" },
    { x: 2, y: 6, color: "cyan" },
    { x: 3, y: 6, color: "cyan" },
    { x: 0, y: 5, color: "blue" },
    { x: 0, y: 4, color: "blue" },
    { x: 0, y: 3, color: "blue" },
    { x: 1, y: 5, color: "blue" },
    { x: 4, y: 6, color: "yellow" },
    { x: 5, y: 6, color: "yellow" },
    { x: 4, y: 5, color: "yellow" },
    { x: 5, y: 5, color: "yellow" },
    { x: 6, y: 6, color: "purple" },
    { x: 7, y: 6, color: "purple" },
    { x: 8, y: 6, color: "purple" },
    { x: 7, y: 5, color: "purple" },
    { x: 2, y: 5, color: "green" },
    { x: 3, y: 5, color: "green" },
    { x: 1, y: 4, color: "green" },
    { x: 2, y: 4, color: "green" },
    // Z piece - fills gap nicely
    { x: 3, y: 4, color: "red" },
    { x: 4, y: 4, color: "red" },
    { x: 4, y: 3, color: "red" },
    { x: 5, y: 3, color: "red" },
  ],

  // State 7: Add L piece (orange)
  [
    { x: 0, y: 6, color: "cyan" },
    { x: 1, y: 6, color: "cyan" },
    { x: 2, y: 6, color: "cyan" },
    { x: 3, y: 6, color: "cyan" },
    { x: 0, y: 5, color: "blue" },
    { x: 0, y: 4, color: "blue" },
    { x: 0, y: 3, color: "blue" },
    { x: 1, y: 5, color: "blue" },
    { x: 4, y: 6, color: "yellow" },
    { x: 5, y: 6, color: "yellow" },
    { x: 4, y: 5, color: "yellow" },
    { x: 5, y: 5, color: "yellow" },
    { x: 6, y: 6, color: "purple" },
    { x: 7, y: 6, color: "purple" },
    { x: 8, y: 6, color: "purple" },
    { x: 7, y: 5, color: "purple" },
    { x: 2, y: 5, color: "green" },
    { x: 3, y: 5, color: "green" },
    { x: 1, y: 4, color: "green" },
    { x: 2, y: 4, color: "green" },
    { x: 3, y: 4, color: "red" },
    { x: 4, y: 4, color: "red" },
    { x: 4, y: 3, color: "red" },
    { x: 5, y: 3, color: "red" },
    // L piece on right side
    { x: 8, y: 5, color: "orange" },
    { x: 8, y: 4, color: "orange" },
    { x: 8, y: 3, color: "orange" },
    { x: 9, y: 5, color: "orange" },
  ],

  // State 8: Fill more gaps with T piece
  [
    { x: 0, y: 6, color: "cyan" },
    { x: 1, y: 6, color: "cyan" },
    { x: 2, y: 6, color: "cyan" },
    { x: 3, y: 6, color: "cyan" },
    { x: 0, y: 5, color: "blue" },
    { x: 0, y: 4, color: "blue" },
    { x: 0, y: 3, color: "blue" },
    { x: 1, y: 5, color: "blue" },
    { x: 4, y: 6, color: "yellow" },
    { x: 5, y: 6, color: "yellow" },
    { x: 4, y: 5, color: "yellow" },
    { x: 5, y: 5, color: "yellow" },
    { x: 6, y: 6, color: "purple" },
    { x: 7, y: 6, color: "purple" },
    { x: 8, y: 6, color: "purple" },
    { x: 7, y: 5, color: "purple" },
    { x: 2, y: 5, color: "green" },
    { x: 3, y: 5, color: "green" },
    { x: 1, y: 4, color: "green" },
    { x: 2, y: 4, color: "green" },
    { x: 3, y: 4, color: "red" },
    { x: 4, y: 4, color: "red" },
    { x: 4, y: 3, color: "red" },
    { x: 5, y: 3, color: "red" },
    { x: 8, y: 5, color: "orange" },
    { x: 8, y: 4, color: "orange" },
    { x: 8, y: 3, color: "orange" },
    { x: 9, y: 5, color: "orange" },
    // I piece at top (drops cleanly without passing through blocks)
    { x: 1, y: 2, color: "cyan" },
    { x: 2, y: 2, color: "cyan" },
    { x: 3, y: 2, color: "cyan" },
    { x: 4, y: 2, color: "cyan" },
  ],
];

const CELL_SIZE = 36;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 7;

interface TetrisLoaderProps {
  message?: string;
}

export default function TetrisLoader({ message = "Finding perfect matches..." }: TetrisLoaderProps) {
  const [currentState, setCurrentState] = useState(0);
  const [previousState, setPreviousState] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentState((prev) => {
        setPreviousState(prev);
        const next = prev + 1;
        if (next >= GRID_STATES.length) {
          return 0;
        }
        return next;
      });
    }, 700);

    return () => clearInterval(interval);
  }, []);

  const currentCells = GRID_STATES[currentState];
  const previousCells = previousState >= 0 ? GRID_STATES[previousState] : [];

  // Find which cells are new in this state
  const newCellKeys = useMemo(() => {
    const prevKeys = new Set(previousCells.map(c => `${c.x}-${c.y}`));
    return new Set(currentCells.filter(c => !prevKeys.has(`${c.x}-${c.y}`)).map(c => `${c.x}-${c.y}`));
  }, [currentCells, previousCells]);

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Tetris blocks - no background */}
      <div
        className="relative"
        style={{
          width: GRID_WIDTH * CELL_SIZE,
          height: GRID_HEIGHT * CELL_SIZE,
        }}
      >
        {currentCells.map((cell) => {
          const colorData = COLORS[cell.color];
          const isNew = newCellKeys.has(`${cell.x}-${cell.y}`);

          return (
            <div
              key={`${cell.x}-${cell.y}`}
              className={`absolute ${isNew ? "tetris-drop" : ""}`}
              style={{
                left: cell.x * CELL_SIZE,
                top: cell.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            >
              <div
                className="absolute inset-0.5 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${colorData.highlight} 0%, ${colorData.color} 50%, ${colorData.shadow} 100%)`,
                  boxShadow: `
                    inset 2px 2px 0 ${colorData.highlight}40,
                    inset -1px -1px 0 ${colorData.shadow}60,
                    2px 2px 4px rgba(0,0,0,0.15)
                  `,
                }}
              >
                {/* Inner highlight */}
                <div
                  className="absolute top-0.5 left-0.5 right-1 bottom-1 rounded-md opacity-30"
                  style={{
                    background: `linear-gradient(135deg, white 0%, transparent 50%)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading message */}
      <p className="mt-8 text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}
