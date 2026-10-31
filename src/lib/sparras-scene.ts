import type { Rect } from "@/lib/scene";

/** Units are CSS pixels of the real homepage at this window size. */
export const viewport = { width: 1280, height: 640 };

export const navHeight = 56;

/** The illustration on the page's own card, where the page shows again. */
export const ownCard: Rect = { x: 282, y: 1259, width: 349, height: 174.5 };

/** Far enough to center the card in the space below the nav. */
export const scrollDistance =
  ownCard.y - navHeight - (viewport.height - navHeight - ownCard.height) / 2;

export const pageHeight = scrollDistance + viewport.height;

const zoomFactor = viewport.width / ownCard.width;

const scrollTime = 1100;
const pauseTime = 150;
const zoomTime = 1500;
const landedTime = 350;

/** One loop: scroll down, zoom into the card, land on the top of the page. */
export const loopDuration = scrollTime + pauseTime + zoomTime + landedTime;

const easeInOut = (time: number) =>
  time < 0.5 ? 4 * time ** 3 : 1 - (2 - 2 * time) ** 3 / 2;

const clamped = (value: number) => Math.min(1, Math.max(0, value));

export type SceneView = {
  /** How far the page has scrolled under the sticky nav. */
  scrolled: number;
  zoom: { x: number; y: number; scale: number };
};

/** What the card shows at a point in the loop, from 0 to 1. */
export function sceneView(progress: number): SceneView {
  const time = progress * loopDuration;
  const fixedPoint = 1 - 1 / zoomFactor;
  const scale =
    zoomFactor **
    easeInOut(clamped((time - scrollTime - pauseTime) / zoomTime));

  return {
    scrolled: easeInOut(clamped(time / scrollTime)) * scrollDistance,
    zoom: {
      x: (ownCard.x / fixedPoint) * (1 - scale),
      y: ((ownCard.y - scrollDistance) / fixedPoint) * (1 - scale),
      scale,
    },
  };
}

const blackHole = { x: 716, y: 160, ringRadius: 74 };
const banner = { left: 258, right: 1022, top: 58, bottom: 362 };

const diskColors = ["#123a8c", "#1a66d6", "#24b4e6", "#8cf0ff", "#ffffff"];
const warmEdge = "#ff4d6d";
const coolEdge = "#3ee08f";

/** The banner's black hole as colored pixels, one path per color. */
function blackHolePaths() {
  const cell = 6;
  const dot = 4;
  const tilt = (14 * Math.PI) / 180;
  const paths = new Map<string, string>();

  for (let y = banner.top; y < banner.bottom; y += cell) {
    for (let x = banner.left; x < banner.right; x += cell) {
      const dx = x + dot / 2 - blackHole.x;
      const dy = y + dot / 2 - blackHole.y;
      const u = dx * Math.cos(tilt) - dy * Math.sin(tilt);
      const v = dx * Math.sin(tilt) + dy * Math.cos(tilt);
      const radius = Math.hypot(dx, dy);
      const disk = Math.max(0, 1 - Math.hypot(u / 310, v / 28)) ** 0.8;
      const ring = Math.max(
        0,
        1 - Math.abs(radius - blackHole.ringRadius) / 19,
      );
      const isInShadow = radius < blackHole.ringRadius - 10;
      if (isInShadow && Math.abs(v) > 11) continue;

      const brightness = isInShadow
        ? disk * 1.3
        : disk * (u > 0 ? 1.4 : 1.15) + ring ** 1.4 * 1.2;
      const level = Math.min(4, Math.floor(brightness * 5));
      if (level === 0) continue;

      const isInnerEdge =
        !isInShadow && radius < blackHole.ringRadius - 4 && disk === 0;
      const color = isInnerEdge
        ? dx < 0
          ? warmEdge
          : coolEdge
        : (diskColors[level] ?? "#ffffff");
      const square = `M${x} ${y}h${dot}v${dot}h-${dot}z`;
      paths.set(color, `${paths.get(color) ?? ""}${square}`);
    }
  }

  return [...paths.entries()].map(([fill, d]) => ({ fill, d }));
}

export const blackHoleLayers = blackHolePaths();
