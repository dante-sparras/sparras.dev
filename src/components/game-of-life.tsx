"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GameOfLifeProps {
  /** CSS variable for the cell color (e.g. "--primary" or "--foreground") */
  colorVariable?: string;
  /** Size of the cell in pixels */
  cellSize?: number;
  /** Probability of a cell being alive at start (0 to 1) */
  density?: number;
  /** Speed of simulation in FPS (lower is more organic) */
  speed?: number;
  /** Opacity of the dead cells trail (0 to 1) */
  fadeAlpha?: number;
  /** * Chance of random "resurrection" per frame (0 to 1).
   * A low value (e.g. 0.001) prevents the grid from getting stuck.
   */
  vitality?: number;
  /** ClassName for the canvas element */
  className?: string;
}

export default function GameOfLifeCanvas({
  colorVariable = "--foreground",
  cellSize = 10,
  density = 0.15,
  speed = 30,
  fadeAlpha = 0.05,
  vitality = 0.005, // 0.5% chance of spontaneous life injection
  className = "",
}: GameOfLifeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  // Simulation State
  const gridRef = useRef<Uint8Array>(new Uint8Array(0));
  const bufferRef = useRef<Uint8Array>(new Uint8Array(0));
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const widthRef = useRef(0);
  const heightRef = useRef(0);
  const animationIdRef = useRef<number>(0);
  const lastFrameTimeRef = useRef(0);

  // Appearance State
  const colorRef = useRef<string>("#000000");

  const updateColorFromCss = useCallback(() => {
    if (typeof window === "undefined") return;
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue(colorVariable)
      .trim();

    if (val) {
      if (val.includes(" ") && !val.startsWith("rgb") && !val.startsWith("#")) {
        colorRef.current = `rgb(${val})`;
      } else {
        colorRef.current = val;
      }
    }
  }, [colorVariable]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <We want to run this when theme changes too.>
  useEffect(() => {
    const t = setTimeout(updateColorFromCss, 0);
    return () => clearTimeout(t);
  }, [updateColorFromCss, resolvedTheme]);

  const updateGrid = useCallback(() => {
    const cols = colsRef.current;
    const grid = gridRef.current;
    const buffer = bufferRef.current;

    // Kernel neighbor offsets
    const offsets = [
      -1,
      1,
      -cols,
      cols,
      -cols - 1,
      -cols + 1,
      cols - 1,
      cols + 1,
    ];

    for (let i = 0; i < grid.length; i++) {
      let neighbors = 0;
      const isLeftEdge = i % cols === 0;
      const isRightEdge = (i + 1) % cols === 0;

      for (const offset of offsets) {
        const neighborIndex = i + offset;
        if (neighborIndex >= 0 && neighborIndex < grid.length) {
          if (
            isLeftEdge &&
            (offset === -1 || offset === -cols - 1 || offset === cols - 1)
          )
            continue;
          if (
            isRightEdge &&
            (offset === 1 || offset === -cols + 1 || offset === cols + 1)
          )
            continue;
          neighbors += grid[neighborIndex];
        }
      }

      const cell = grid[i];
      if (cell === 1) {
        buffer[i] = neighbors === 2 || neighbors === 3 ? 1 : 0;
      } else {
        buffer[i] = neighbors === 3 ? 1 : 0;
      }
    }

    const temp = gridRef.current;
    gridRef.current = bufferRef.current;
    bufferRef.current = temp;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const width = widthRef.current;
      const height = heightRef.current;

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = colorRef.current;
      ctx.beginPath();

      const grid = gridRef.current;
      const cols = colsRef.current;
      const offset = cellSize / 2;

      for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
          const x = (i % cols) * cellSize;
          const y = Math.floor(i / cols) * cellSize;
          ctx.moveTo(x + offset, y + offset);
          ctx.arc(x + offset, y + offset, cellSize / 2 - 1, 0, Math.PI * 2);
        }
      }

      ctx.fill();
    },
    [cellSize, fadeAlpha],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    updateColorFromCss();

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        widthRef.current = parent.clientWidth;
        heightRef.current = parent.clientHeight;
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(widthRef.current * dpr));
      canvas.height = Math.max(1, Math.floor(heightRef.current * dpr));
      canvas.style.width = `${widthRef.current}px`;
      canvas.style.height = `${heightRef.current}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      colsRef.current = Math.ceil(widthRef.current / cellSize);
      rowsRef.current = Math.ceil(heightRef.current / cellSize);
      const size = colsRef.current * rowsRef.current;

      gridRef.current = new Uint8Array(size);
      bufferRef.current = new Uint8Array(size);

      for (let i = 0; i < size; i++) {
        gridRef.current[i] = Math.random() < density ? 1 : 0;
      }
    };

    const loop = (timestamp: number) => {
      const throttle = 1000 / speed;
      const delta = timestamp - lastFrameTimeRef.current;

      if (delta > throttle) {
        // --- VITALITY INJECTION ---
        // Randomly awaken dead cells to prevent stagnation
        if (vitality > 0) {
          const size = gridRef.current.length;
          // The lower the density, the more we need to inject to keep it interesting
          const injections = Math.ceil(size * vitality * 0.01);

          for (let k = 0; k < injections; k++) {
            // Simple random selection is performant enough for small injection counts
            const randomIdx = Math.floor(Math.random() * size);
            gridRef.current[randomIdx] = 1;
          }
        }
        // --------------------------

        updateGrid();
        draw(ctx);
        lastFrameTimeRef.current = timestamp - (delta % throttle);
      }
      animationIdRef.current = requestAnimationFrame(loop);
    };

    resize();
    animationIdRef.current = requestAnimationFrame(loop);

    let resizeTimeout: number | undefined;
    const handleResize = () => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(resize, 100);
    };
    window.addEventListener("resize", handleResize);

    let resizeObserver: ResizeObserver | null = null;
    const parent = canvas.parentElement;
    if (parent && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(parent);
    }

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      resizeObserver?.disconnect();
    };
  }, [
    cellSize,
    density,
    speed,
    updateGrid,
    draw,
    updateColorFromCss,
    vitality,
  ]);

  const handleInteraction = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const x = Math.floor((clientX - rect.left) / cellSize);
    const y = Math.floor((clientY - rect.top) / cellSize);

    if (x >= 0 && x < colsRef.current && y >= 0 && y < rowsRef.current) {
      const index = x + y * colsRef.current;
      gridRef.current[index] = 1;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-auto block h-full w-full touch-none",
        className,
      )}
      onPointerDown={handleInteraction}
      onPointerMove={(e) => e.buttons === 1 && handleInteraction(e)}
    />
  );
}
