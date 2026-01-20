"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface GameOfLifeProps {
  /** Target cell size in pixels */
  targetCellSize?: number;
  /** Simulation speed in milliseconds */
  speed?: number;
  /** Initial density of live cells (0-1) */
  initialDensity?: number;
  /** CSS variable for cell color */
  cellColorVar?: string;
  /** CSS variable for background */
  backgroundColorVar?: string;
  /** CSS variable for grid lines */
  gridColorVar?: string;
  /** Whether to show grid lines */
  showGrid?: boolean;
  /** Cell corner radius (0 = square, 0.5 = circle) */
  cellRadius?: number;
  /**
   * Trail intensity (0 to 1).
   * Higher values make the trails last longer.
   */
  fadeIntensity?: number;
  /**
   * Stagnation Threshold.
   * The number of generations a pattern must repeat (or stay empty)
   * before new random life is injected.
   * Lower values = More activity (resets stuck patterns faster).
   * Default: 50
   */
  stagnationThreshold?: number;
  className?: string;
}

type Grid = boolean[][];

interface GridLayout {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
}

interface ThemeColors {
  cell: string;
  background: string;
  grid: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_COLORS = {
  light: {
    cell: "oklch(0.25 0.02 260)",
    background: "oklch(0.98 0.01 260)",
    grid: "oklch(0.92 0.01 260)",
  },
  dark: {
    cell: "oklch(0.9 0.02 260)",
    background: "oklch(0.15 0.02 260)",
    grid: "oklch(0.25 0.02 260)",
  },
} as const;

const PATTERNS = {
  glider: [
    [0, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  lightweightSpaceship: [
    [0, 1],
    [0, 4],
    [1, 0],
    [2, 0],
    [2, 4],
    [3, 0],
    [3, 1],
    [3, 2],
    [3, 3],
  ],
} as const;

const HISTORY_SIZE = 12; // Increased slightly to catch longer oscillating loops
const MIN_POPULATION_RATIO = 0.03; // Increased slightly to keep board more active

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

function calculateGridLayout(
  containerWidth: number,
  containerHeight: number,
  targetCellSize: number,
): GridLayout {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return {
      rows: 1,
      cols: 1,
      cellWidth: targetCellSize,
      cellHeight: targetCellSize,
    };
  }

  const idealCols = Math.max(1, Math.round(containerWidth / targetCellSize));
  const idealRows = Math.max(1, Math.round(containerHeight / targetCellSize));

  return {
    rows: idealRows,
    cols: idealCols,
    cellWidth: containerWidth / idealCols,
    cellHeight: containerHeight / idealRows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GRID LOGIC
// ─────────────────────────────────────────────────────────────────────────────

function createEmptyGrid(rows: number, cols: number): Grid {
  return Array.from(
    { length: rows },
    () => Array(cols).fill(false) as boolean[],
  );
}

function createRandomGrid(rows: number, cols: number, density: number): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.random() < density),
  );
}

// The fade grid stores opacity values from 0.0 to 1.0
function createEmptyFadeGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0) as number[]);
}

function countNeighbors(grid: Grid, row: number, col: number): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const neighborRow = (row + i + rows) % rows;
      const neighborCol = (col + j + cols) % cols;
      if (grid[neighborRow][neighborCol]) count++;
    }
  }
  return count;
}

function computeNextGeneration(grid: Grid): Grid {
  const rows = grid.length;
  const cols = grid[0].length;
  const nextGrid = createEmptyGrid(rows, cols);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const neighbors = countNeighbors(grid, row, col);
      const isAlive = grid[row][col];
      nextGrid[row][col] = isAlive
        ? neighbors === 2 || neighbors === 3
        : neighbors === 3;
    }
  }
  return nextGrid;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATTERNS & STAGNATION
// ─────────────────────────────────────────────────────────────────────────────

function addPatternToGrid(
  grid: Grid,
  pattern: readonly (readonly number[])[],
  startRow: number,
  startCol: number,
): void {
  const rows = grid.length;
  const cols = grid[0].length;
  pattern.forEach(([r, c]) => {
    const targetRow = (startRow + r + rows) % rows; // Wrap around logic
    const targetCol = (startCol + c + cols) % cols;
    grid[targetRow][targetCol] = true;
  });
}

function injectRandomPattern(grid: Grid): void {
  const rows = grid.length;
  const cols = grid[0].length;
  const patternChoice = Math.random();

  // Try to inject near the center-ish area for visibility
  const rRow = () =>
    Math.floor(Math.random() * (rows * 0.8)) + Math.floor(rows * 0.1);
  const rCol = () =>
    Math.floor(Math.random() * (cols * 0.8)) + Math.floor(cols * 0.1);

  if (patternChoice < 0.25) {
    // Gliders
    addPatternToGrid(grid, PATTERNS.glider, rRow(), rCol());
    // Add a second one for chaos
    addPatternToGrid(grid, PATTERNS.glider, rRow(), rCol());
  } else if (patternChoice < 0.5) {
    // Spaceships
    addPatternToGrid(grid, PATTERNS.lightweightSpaceship, rRow(), rCol());
  } else {
    // Random noise splash
    const cellsToAdd = Math.floor(rows * cols * 0.05); // 5% new cells
    for (let i = 0; i < cellsToAdd; i++) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      grid[row][col] = true;
    }
  }
}

interface StagnationState {
  history: string[];
  count: number;
}

function checkStagnation(
  grid: Grid,
  state: StagnationState,
  threshold: number,
): boolean {
  // Simple hash of the grid state
  const currentHash = grid
    .map((row) => row.map((cell) => (cell ? "1" : "0")).join(""))
    .join("");

  // Check if this specific state has been seen recently
  if (state.history.includes(currentHash)) {
    state.count++;
  } else {
    // If it's a new unique state, we slowly decay the stagnation count
    // instead of resetting it to 0. This detects "looping" behavior better.
    state.count = Math.max(0, state.count - 1);
  }

  state.history.push(currentHash);
  if (state.history.length > HISTORY_SIZE) state.history.shift();

  // Population check: if too empty, accelerate stagnation count
  const liveCount = grid.flat().filter(Boolean).length;
  if (liveCount < grid.length * grid[0].length * MIN_POPULATION_RATIO) {
    state.count += 2; // Accelerate reset if empty
  }

  return state.count >= threshold;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDERING & HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getThemeColors(
  isDark: boolean,
  cellColorVar?: string,
  backgroundColorVar?: string,
  gridColorVar?: string,
): ThemeColors {
  const getVar = (name: string) => {
    if (typeof window === "undefined") return null;
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim() || null
    );
  };

  const defaults = isDark ? DEFAULT_COLORS.dark : DEFAULT_COLORS.light;

  return {
    cell: (cellColorVar && getVar(cellColorVar)) || defaults.cell,
    background:
      (backgroundColorVar && getVar(backgroundColorVar)) || defaults.background,
    grid: (gridColorVar && getVar(gridColorVar)) || defaults.grid,
  };
}

function drawCells(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  fadeGrid: number[][],
  layout: GridLayout,
  cellRadius: number,
  fadeIntensity: number,
  cellColor: string,
): void {
  const { rows, cols, cellWidth, cellHeight } = layout;
  const minDim = Math.min(cellWidth, cellHeight);
  const radius = minDim * cellRadius;
  const padding = minDim * 0.05;
  const sizeX = cellWidth - padding * 2;
  const sizeY = cellHeight - padding * 2;

  const decay = Math.max(0.005, (1 - fadeIntensity) * 0.1);

  for (let row = 0; row < rows; row++) {
    if (!fadeGrid[row]) continue;

    for (let col = 0; col < cols; col++) {
      const isAlive = grid[row]?.[col];
      let opacity = fadeGrid[row][col] || 0;

      if (isAlive) {
        opacity = 1;
      } else if (opacity > 0) {
        opacity = Math.max(0, opacity - decay);
      }

      fadeGrid[row][col] = opacity;

      if (opacity <= 0.001) continue;

      const x = col * cellWidth + padding;
      const y = row * cellHeight + padding;

      ctx.globalAlpha = opacity;
      ctx.fillStyle = cellColor;

      if (radius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, sizeX, sizeY, radius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, sizeX, sizeY);
      }
    }
  }
  ctx.globalAlpha = 1.0;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function GameOfLife({
  targetCellSize = 12,
  speed = 80,
  initialDensity = 0.25,
  cellColorVar,
  backgroundColorVar,
  gridColorVar,
  showGrid = false,
  cellRadius = 0.15,
  fadeIntensity = 0.6,
  stagnationThreshold = 50, // Default to 50
  className = "",
}: GameOfLifeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Grid>([]);
  const fadeGridRef = useRef<number[][]>([]);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const stagnationRef = useRef<StagnationState>({ history: [], count: 0 });

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const colors = getThemeColors(
    isDark,
    cellColorVar,
    backgroundColorVar,
    gridColorVar,
  );

  const initializeGrid = useCallback(() => {
    const { rows, cols } = calculateGridLayout(
      dimensions.width,
      dimensions.height,
      targetCellSize,
    );
    gridRef.current = createRandomGrid(rows, cols, initialDensity);
    fadeGridRef.current = createEmptyFadeGrid(rows, cols);
    stagnationRef.current = { history: [], count: 0 };
  }, [dimensions.width, dimensions.height, targetCellSize, initialDensity]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const layout = calculateGridLayout(
      dimensions.width,
      dimensions.height,
      targetCellSize,
    );

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 0.5;
      for (let row = 0; row <= layout.rows; row++) {
        const y = row * layout.cellHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(layout.cols * layout.cellWidth, y);
        ctx.stroke();
      }
      for (let col = 0; col <= layout.cols; col++) {
        const x = col * layout.cellWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, layout.rows * layout.cellHeight);
        ctx.stroke();
      }
    }

    drawCells(
      ctx,
      gridRef.current,
      fadeGridRef.current,
      layout,
      cellRadius,
      fadeIntensity,
      colors.cell,
    );
  }, [
    dimensions.width,
    dimensions.height,
    targetCellSize,
    colors,
    showGrid,
    cellRadius,
    fadeIntensity,
  ]);

  const animate = useCallback(
    (timestamp: number) => {
      const shouldUpdate = timestamp - lastUpdateRef.current >= speed;

      if (shouldUpdate) {
        // Pass the dynamic threshold here
        if (
          checkStagnation(
            gridRef.current,
            stagnationRef.current,
            stagnationThreshold,
          )
        ) {
          injectRandomPattern(gridRef.current);
          // Reset slightly below 0 to give the new pattern a chance to breathe
          stagnationRef.current = { history: [], count: 0 };
        }
        gridRef.current = computeNextGeneration(gridRef.current);
        lastUpdateRef.current = timestamp;
      }

      draw();
      animationRef.current = requestAnimationFrame(animate);
    },
    [speed, draw, stagnationThreshold], // Added stagnationThreshold dependency
  );

  const handleInteract = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const layout = calculateGridLayout(
        dimensions.width,
        dimensions.height,
        targetCellSize,
      );
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const col = Math.floor(x / layout.cellWidth);
      const row = Math.floor(y / layout.cellHeight);

      if (row >= 0 && row < layout.rows && col >= 0 && col < layout.cols) {
        if (gridRef.current[row]) {
          gridRef.current[row][col] = true;
          if (fadeGridRef.current[row]) {
            fadeGridRef.current[row][col] = 1;
          }
          // Reset stagnation on user interaction
          stagnationRef.current = { history: [], count: 0 };
        }
      }
    },
    [dimensions, targetCellSize],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) initializeGrid();
  }, [dimensions, initializeGrid]);

  useEffect(() => {
    if (gridRef.current.length) {
      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [animate]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={mounted ? { background: colors.background } : undefined}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block cursor-crosshair touch-none"
        style={{ width: dimensions.width, height: dimensions.height }}
        onPointerDown={(e) => {
          setIsDrawing(true);
          handleInteract(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (isDrawing) handleInteract(e.clientX, e.clientY);
        }}
        onPointerUp={() => setIsDrawing(false)}
        onPointerLeave={() => setIsDrawing(false)}
      />
    </div>
  );
}
