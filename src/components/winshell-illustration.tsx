"use client";

import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { useSceneFrame } from "@/hooks/use-scene-frame";
import { boxStyle, type Rect, units } from "@/lib/scene";
import { cn } from "@/lib/utils";
import {
  type Desktop,
  dashboardRects,
  desktops,
  restFrame,
  sceneFrames,
  type WinshellFrame,
} from "@/lib/winshell-scene";

const inkColor = "#0a0a0a";

type Block = Rect & { opacity: number; radius?: number; fill?: string };

const block = (
  x: number,
  y: number,
  width: number,
  height: number,
  opacity = 1,
  radius?: number,
): Block => ({ x, y, width, height, opacity, radius });

const ink = (x: number, y: number, width: number, height: number): Block => ({
  ...block(x, y, width, height),
  fill: inkColor,
});

function BlockList({ blocks }: { blocks: readonly Block[] }) {
  return blocks.map(({ opacity, radius, fill = "#fff", ...rect }) => (
    <div
      key={`${rect.x}-${rect.y}-${rect.width}-${rect.height}`}
      className="absolute"
      style={{
        ...boxStyle(rect),
        opacity,
        background: fill,
        borderRadius: radius ? units(radius) : undefined,
      }}
    />
  ));
}

/** A row of 3×5 pixels, read left to right and top to bottom. */
const digitPixels = [
  "111101101101111",
  "010110010010111",
  "111001111100111",
  "111001111001111",
  "101101111001001",
  "111100111001111",
  "111100111101111",
  "111001001001001",
  "111101111101111",
  "111101111001111",
];

function pixelDigit(value: number, x: number, y: number, cell: number) {
  const pixels = digitPixels[value % 10] ?? "";

  return Array.from(pixels).flatMap((pixel, index) =>
    pixel === "1"
      ? [
          // Slightly oversized, so rounding never opens a gap between pixels.
          block(
            x + (index % 3) * cell,
            y + Math.floor(index / 3) * cell,
            cell + 2,
            cell + 2,
          ),
        ]
      : [],
  );
}

/** 12:3x in pixel digits, four cells wide per digit. */
function pixelClock(minute: number, x: number, y: number, cell: number) {
  return [
    ...pixelDigit(1, x, y, cell),
    ...pixelDigit(2, x + cell * 4, y, cell),
    block(x + cell * 8, y + cell, cell, cell),
    block(x + cell * 8, y + cell * 3, cell, cell),
    ...pixelDigit(3, x + cell * 10, y, cell),
    ...pixelDigit(minute, x + cell * 14, y, cell),
  ];
}

function DashboardCard({
  rect,
  children,
}: {
  rect: Rect;
  children: ReactNode;
}) {
  return (
    <div
      // An inset shadow, because a border would push the content off-center.
      className="absolute overflow-hidden bg-[#141414] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)]"
      style={{ ...boxStyle(rect), borderRadius: units(14) }}
    >
      {children}
    </div>
  );
}

const workspaceDots = [0, 1, 2, 3];
const graphColumns = Array.from({ length: 18 }, (_, column) => column);

/**
 * One SVG for the outline and its content, so they scale and round as one.
 * As separate boxes, the browser rounds each to whole pixels on its own, which
 * pushes the content off-center and turns the dots into ovals.
 */
function DashboardRail({ tick }: { tick: number }) {
  const { width, height } = dashboardRects.bar;

  return (
    <svg
      aria-hidden
      className="absolute"
      fill="#fff"
      style={boxStyle(dashboardRects.bar)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <rect
        x={1.75}
        y={1.75}
        width={width - 3.5}
        height={height - 3.5}
        rx={13}
        fill="#141414"
        stroke="rgb(255 255 255 / 0.25)"
        strokeWidth={3.5}
      />
      <rect x={20} y={20} width={10} height={10} />
      <rect x={34} y={20} width={10} height={10} opacity={0.55} />
      <rect x={20} y={34} width={10} height={10} opacity={0.55} />
      <rect x={34} y={34} width={10} height={10} />
      {workspaceDots.map((dot) => (
        <circle
          key={dot}
          cx={width / 2}
          cy={228 + dot * 32}
          r={6}
          opacity={0.25}
        />
      ))}
      <rect
        x={20}
        y={214}
        width={24}
        height={28}
        rx={12}
        className="transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${tick * 64}px)` }}
      />
      <rect x={16} y={512} width={32} height={8} opacity={0.8} />
    </svg>
  );
}

function DashboardDesktop({ tick, minute }: { tick: number; minute: number }) {
  return (
    <div
      className="absolute inset-0 bg-black"
      style={{
        backgroundImage:
          "radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px)",
        backgroundSize: `${units(30)} ${units(30)}`,
      }}
    >
      <DashboardRail tick={tick} />
      <BlockList
        blocks={[
          ...pixelClock(minute, 216, 226, 22),
          block(218, 362, 176, 8, 0.45),
        ]}
      />
      <DashboardCard rect={dashboardRects.media}>
        <BlockList
          blocks={[
            block(24, 24, 128, 128, 0.18, 10),
            block(60, 60, 56, 56, 0.8, 28),
            block(176, 40, 200, 10, 0.95),
            block(176, 62, 128, 8, 0.4),
            block(176, 104, 16, 16, 0.5),
            block(204, 100, 24, 24, 0.95),
            block(240, 104, 16, 16, 0.5),
            block(176, 144, 248, 6, 0.2),
          ]}
        />
        <div
          className="absolute bg-white transition-[width] duration-700 ease-out"
          style={boxStyle({ x: 176, y: 144, width: 88 + tick * 80, height: 6 })}
        />
      </DashboardCard>
      <DashboardCard rect={dashboardRects.graph}>
        {graphColumns.map((column) => {
          const height = 36 + ((column * 37 + tick * 53) % 84);

          return (
            <div
              key={column}
              className="absolute bg-white opacity-80 transition-[top,height] duration-500 ease-out"
              style={boxStyle({
                x: 24 + column * 22.4,
                y: 152 - height,
                width: 12,
                height,
              })}
            />
          );
        })}
      </DashboardCard>
    </div>
  );
}

const islandSpring = "cubic-bezier(0.3, 1.3, 0.5, 1)";

const dunes = [
  { x: -280, y: 372, width: 1120, height: 520, fill: "#3d3d3d" },
  { x: 430, y: 404, width: 1240, height: 520, fill: "#2a2a2a" },
  { x: -220, y: 476, width: 1760, height: 520, fill: "#171717" },
];

const islandClosed: Rect = { x: 500, y: 20, width: 200, height: 44 };
const islandOpen: Rect = { x: 340, y: 20, width: 520, height: 136 };

const pillBars = [
  { x: 640, height: 12 },
  { x: 650, height: 22 },
  { x: 660, height: 16 },
  { x: 670, height: 8 },
];

const playerBars = [
  { x: 772, height: 18 },
  { x: 784, height: 34 },
  { x: 796, height: 24 },
  { x: 808, height: 40 },
  { x: 820, height: 14 },
];

const dockIconSize = 52;
const dockTop = 514;

const tile = (fill: string): Block => ({
  ...block(0, 0, dockIconSize, dockIconSize, 1, 14),
  fill,
});

const dockIcons = [
  {
    name: "launcher",
    blocks: [
      tile("#f5f5f5"),
      ...[14, 29].flatMap((x) => [ink(x, 14, 9, 9), ink(x, 29, 9, 9)]),
    ],
  },
  {
    name: "files",
    blocks: [tile("#3a3a3a"), block(12, 15, 13, 5), block(12, 20, 28, 18)],
  },
  {
    name: "browser",
    blocks: [
      tile("#f5f5f5"),
      { ...ink(11, 11, 30, 30), radius: 15 },
      { ...block(16, 16, 20, 20), radius: 10 },
    ],
  },
  {
    name: "mail",
    blocks: [
      tile("#8a8a8a"),
      block(11, 16, 30, 20),
      ink(15, 22, 22, 3),
      ink(15, 28, 14, 3),
    ],
  },
  {
    name: "music",
    blocks: [
      tile("#0a0a0a"),
      { ...block(12, 12, 28, 28), radius: 14 },
      { ...ink(21, 21, 10, 10), radius: 5 },
    ],
  },
  {
    name: "photos",
    blocks: [
      tile("#d4d4d4"),
      { ...ink(12, 12, 12, 12), radius: 6 },
      ink(12, 30, 28, 10),
    ],
  },
  {
    name: "terminal",
    blocks: [
      tile("#262626"),
      block(13, 15, 5, 5),
      block(18, 20, 5, 5),
      block(13, 25, 5, 5),
      block(26, 30, 13, 4),
    ],
  },
];

const hoveredDockIcon = 4;

/** The icon under the pointer grows the most, its neighbors a little. */
function dockScale(index: number) {
  const distance = Math.abs(index - hoveredDockIcon);
  return [1.32, 1.14][distance] ?? 1;
}

function IslandDesktop({ tick }: { tick: number }) {
  const isOpen = tick === 1;

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {dunes.map(({ fill, ...rect }) => (
        <div
          key={fill}
          className="absolute rounded-[50%]"
          style={{ ...boxStyle(rect), background: fill }}
        />
      ))}
      <div
        className="absolute border border-white/25 bg-[#141414] transition-[left,width,height,border-radius] duration-500"
        style={{
          ...boxStyle(isOpen ? islandOpen : islandClosed),
          borderRadius: units(isOpen ? 38 : 22),
          transitionTimingFunction: islandSpring,
        }}
      />
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-150",
          isOpen && "opacity-0",
        )}
      >
        <BlockList
          blocks={[
            block(524, 36, 12, 12, 0.9, 6),
            block(548, 38, 72, 8, 0.45),
            ...pillBars.map(({ x, height }) =>
              block(x, 42 - height / 2, 6, height, 0.9),
            ),
          ]}
        />
      </div>
      <div
        className={cn(
          "absolute inset-0 transition-opacity",
          isOpen ? "delay-200 duration-300" : "opacity-0 duration-100",
        )}
      >
        <BlockList
          blocks={[
            block(364, 40, 96, 96, 0.22, 16),
            block(388, 64, 48, 48, 0.85, 24),
            block(484, 54, 220, 10, 0.95),
            block(484, 76, 140, 8, 0.45),
            block(484, 116, 340, 6, 0.2),
            block(484, 116, 148, 6),
            ...playerBars.map(({ x, height }) =>
              block(x, 72 - height / 2, 7, height, 0.85),
            ),
          ]}
        />
      </div>
      <div
        className="absolute border border-white/30 bg-white/20 backdrop-blur-sm"
        style={{
          ...boxStyle({ x: 320, y: 498, width: 560, height: 84 }),
          borderRadius: units(28),
        }}
      />
      {dockIcons.map(({ name, blocks }, index) => (
        <div
          key={name}
          className="absolute transition-[scale] duration-300"
          style={{
            ...boxStyle({
              x: 346 + index * 76,
              y: dockTop,
              width: dockIconSize,
              height: dockIconSize,
            }),
            scale: isOpen ? dockScale(index) : 1,
            transformOrigin: "50% 100%",
            transitionTimingFunction: islandSpring,
          }}
        >
          <BlockList blocks={blocks} />
        </div>
      ))}
    </div>
  );
}

const hudCenter = { x: 600, y: 300 };
const launcherDots = [0, 1, 2, 3, 4, 5, 6, 7];

const gauges = [
  { y: 130, percent: [62, 78] },
  { y: 300, percent: [38, 44] },
  { y: 470, percent: [84, 71] },
];

const hudList = [
  { y: 196, width: 208 },
  { y: 228, width: 160 },
  { y: 260, width: 184 },
];

const hudWave = Array.from({ length: 18 }, (_, column) => column);

/** A circle of the given radius, cut down to a ring of `thickness`. */
function ringStyle(
  center: { x: number; y: number },
  radius: number,
  thickness: number,
): CSSProperties {
  const edge = `calc(100% - ${units(thickness)})`;
  const mask = `radial-gradient(farthest-side, transparent ${edge}, #000 ${edge})`;

  return {
    ...boxStyle({
      x: center.x - radius,
      y: center.y - radius,
      width: radius * 2,
      height: radius * 2,
    }),
    maskImage: mask,
    WebkitMaskImage: mask,
  };
}

function HudRing({
  radius,
  thickness,
  background,
  rotation = 0,
  center = hudCenter,
}: {
  radius: number;
  thickness: number;
  background: string;
  rotation?: number;
  center?: { x: number; y: number };
}) {
  return (
    <div
      className="absolute rounded-full transition-[rotate] duration-1000 ease-in-out"
      style={{
        ...ringStyle(center, radius, thickness),
        background,
        rotate: `${rotation}deg`,
      }}
    />
  );
}

const arc = (percent: number, rest = "rgb(255 255 255 / 0.12)") =>
  `conic-gradient(#fff ${percent}%, ${rest} 0)`;

function HudDesktop({ tick, minute }: { tick: number; minute: number }) {
  const launcherRadius = 172;

  return (
    <div className="absolute inset-0 bg-black">
      <HudRing
        radius={282}
        thickness={14}
        rotation={tick * 40}
        background="repeating-conic-gradient(rgb(255 255 255 / 0.55) 0 1.5deg, transparent 1.5deg 7.5deg)"
      />
      <HudRing
        radius={256}
        thickness={8}
        rotation={tick * -70}
        background={arc(68, "transparent")}
      />
      <HudRing radius={234} thickness={2} background="rgb(255 255 255 / 0.3)" />
      {launcherDots.map((dot) => {
        const angle = (dot / launcherDots.length) * Math.PI * 2;
        const isSelected = dot === tick * 3;

        return (
          <div
            key={dot}
            className={cn(
              "absolute rounded-full border transition-colors duration-300",
              isSelected ? "border-white bg-white" : "border-white/40",
            )}
            style={{
              ...boxStyle({
                x:
                  hudCenter.x +
                  Math.round(Math.cos(angle) * launcherRadius) -
                  17,
                y:
                  hudCenter.y +
                  Math.round(Math.sin(angle) * launcherRadius) -
                  17,
                width: 34,
                height: 34,
              }),
            }}
          />
        );
      })}
      <BlockList
        blocks={[
          ...pixelClock(minute, hudCenter.x - 97, hudCenter.y - 44, 10),
          block(hudCenter.x - 70, hudCenter.y + 28, 140, 7, 0.45),
          block(hudCenter.x - 44, hudCenter.y + 46, 88, 7, 0.25),
        ]}
      />
      {gauges.map(({ y, percent }) => {
        const center = { x: 136, y };

        return (
          <div key={y}>
            <HudRing
              center={center}
              radius={68}
              thickness={12}
              background={arc(percent[tick] ?? 0)}
            />
            <BlockList blocks={[block(center.x - 24, y - 4, 48, 8, 0.7)]} />
          </div>
        );
      })}
      <BlockList
        blocks={[
          block(936, 160, 120, 8, 0.55),
          ...hudList.flatMap(({ y, width }) => [
            block(936, y, 8, 8, 0.8),
            block(956, y, width, 8, 0.3),
          ]),
        ]}
      />
      {hudWave.map((column) => {
        const height = 24 + ((column * 41 + tick * 67) % 96);

        return (
          <div
            key={column}
            className="absolute bg-white opacity-70 transition-[top,height] duration-500 ease-out"
            style={boxStyle({
              x: 936 + column * 13,
              y: 372 - height / 2,
              width: 7,
              height,
            })}
          />
        );
      })}
    </div>
  );
}

const desktopScenes: Record<Desktop, typeof HudDesktop> = {
  dashboard: DashboardDesktop,
  island: IslandDesktop,
  hud: HudDesktop,
};

/** The new desktop wipes in over the old one, which then steps aside. */
function DesktopLayer({
  desktop,
  frame,
}: {
  desktop: Desktop;
  frame: WinshellFrame;
}) {
  const isShown = frame.desktop === desktop;
  const Scene = desktopScenes[desktop];

  // A desktop keeps its last frame while the next one wipes over it, because
  // going back to its start would show through until it is fully covered.
  const [lastShownFrame, setLastShownFrame] = useState(frame);
  useEffect(() => {
    if (isShown) setLastShownFrame(frame);
  }, [isShown, frame]);
  const { tick, minute } = isShown ? frame : lastShownFrame;

  return (
    <div
      className={cn(
        "absolute inset-0 transition-[clip-path] ease-in-out",
        isShown
          ? "z-10 duration-500 [clip-path:inset(0)]"
          : "delay-500 duration-0 [clip-path:inset(0_0_100%_0)]",
      )}
    >
      <Scene tick={tick} minute={minute} />
    </div>
  );
}

/** Winshell itself: one toolkit, three desktops that share nothing else. */
export function WinshellIllustration({
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
      {desktops.map((desktop) => (
        <DesktopLayer key={desktop} desktop={desktop} frame={frame} />
      ))}
    </div>
  );
}
