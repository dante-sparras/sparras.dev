"use client";

import { useSceneFrame } from "@/hooks/use-scene-frame";
import { boxStyle, units } from "@/lib/scene";
import { cn } from "@/lib/utils";
import {
  openingSlots,
  restFrame,
  type SceneFrame,
  type SceneWindow,
  sceneFrames,
  workspaceWindows,
} from "@/lib/winland-scene";

/** A line of text: left, top and width, measured from the window's corner. */
type TextLine = readonly [x: number, y: number, width: number];

const column = (x: number, top: number, widths: readonly number[]) =>
  widths.map((width, row): TextLine => [x, top + row * 24, width]);

const windowText: Record<SceneWindow, readonly TextLine[]> = {
  a: [
    [24, 56, 96],
    [136, 56, 168],
    [48, 80, 216],
    [48, 104, 120],
    [184, 104, 184],
    [72, 128, 264],
    [72, 152, 152],
    [48, 176, 88],
    [24, 200, 40],
    [24, 224, 168],
    [48, 248, 232],
    [296, 248, 88],
    [72, 272, 136],
    [72, 296, 288],
    [48, 320, 104],
    [24, 344, 40],
    [24, 368, 120],
    [24, 480, 120],
  ],
  b: column(24, 56, [232, 344, 176, 288, 128, 312, 200, 96]),
  c: column(24, 56, [136, 208, 96, 176, 144, 224, 112, 168]),
  d: column(24, 56, [184, 112, 160, 216, 96, 176, 136, 200]),
  e: column(24, 56, [288, 176, 344, 216, 128, 264, 96, 312, 184, 232]),
  f: column(24, 56, [200, 312, 144, 256, 104, 288, 176, 120]),
  g: column(24, 56, [264, 128, 224, 336, 160, 208, 96, 248]),
};

const workspaceDots = [0, 1, 2, 3, 4];

const openTransition =
  "left 300ms ease-out, top 300ms ease-out, width 300ms ease-out, height 300ms ease-out, opacity 200ms, scale 200ms, background-color 200ms, border-color 200ms";

/** A closing window fades first, then jumps back to where it will reopen. */
const closedTransition =
  "left 0s 200ms, top 0s 200ms, width 0s 200ms, height 0s 200ms, opacity 200ms, scale 200ms, background-color 200ms, border-color 200ms";

function SceneWindowPane({
  name,
  frame,
}: {
  name: SceneWindow;
  frame: SceneFrame;
}) {
  const slot = frame.layout[name];
  const isFocused = frame.focused === name;

  return (
    <div
      className={cn(
        "absolute overflow-hidden border",
        isFocused
          ? "z-10 border-white bg-[#141414]"
          : "border-white/25 bg-[#0f0f0f]",
        !slot && "scale-95 opacity-0",
      )}
      style={{
        ...boxStyle(slot ?? openingSlots[name]),
        transition: slot ? openTransition : closedTransition,
      }}
    >
      <div
        className={cn(
          "transition-colors duration-200",
          isFocused ? "bg-[#1f1f1f]" : "bg-[#171717]",
        )}
        style={{ height: units(28) }}
      />
      {[0, 1, 2].map((dot) => (
        <div
          key={dot}
          className={cn(
            "absolute bg-white transition-opacity duration-200",
            dot > 0 && "opacity-40",
            !isFocused && "opacity-0",
          )}
          style={boxStyle({ x: 16 + dot * 16, y: 10, width: 8, height: 8 })}
        />
      ))}
      <div
        className={cn(
          "transition-opacity duration-200",
          isFocused ? "opacity-55" : "opacity-25",
        )}
      >
        {windowText[name].map(([x, y, width]) => (
          <div
            key={`${x}-${y}`}
            className="absolute bg-white"
            style={boxStyle({ x, y, width, height: 8 })}
          />
        ))}
      </div>
      {name === "a" ? (
        <div
          className={cn(
            "absolute bg-white transition-opacity duration-200",
            !isFocused && "opacity-0",
          )}
          style={boxStyle({ x: 152, y: 476, width: 10, height: 16 })}
        />
      ) : null}
    </div>
  );
}

/** Winland itself: windows open, trade places, then the workspace changes. */
export function WinlandIllustration({
  alt,
  isPlaying,
}: {
  alt: string;
  isPlaying: boolean;
}) {
  const frame = useSceneFrame(sceneFrames, restFrame, isPlaying);

  return (
    <div
      role="img"
      aria-label={alt}
      className="@container absolute inset-0 overflow-hidden bg-black"
    >
      {workspaceWindows.map((windows, workspace) => (
        <div
          key={windows[0]}
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(${(workspace - frame.workspace) * 100}%)`,
          }}
        >
          {windows.map((name) => (
            <SceneWindowPane key={name} name={name} frame={frame} />
          ))}
        </div>
      ))}
      {workspaceDots.map((dot) => (
        <div
          key={dot}
          className={cn(
            "absolute transition-colors duration-300",
            dot === frame.workspace ? "bg-white" : "bg-white/12",
          )}
          style={boxStyle({ x: 528 + dot * 24, y: 566, width: 16, height: 8 })}
        />
      ))}
    </div>
  );
}
