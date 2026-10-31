"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  blackHoleLayers,
  loopDuration,
  navHeight,
  ownCard,
  pageHeight,
  sceneView,
  viewport,
} from "@/lib/sparras-scene";

const settleDuration = 360;

/** The page's column, the same as on the real page. */
const column = { left: 256, right: 1023 };
const gutter = 281;

/** How much the banner strip pulled everything below it up the page. */
const bannerSavings = 63;

/** How much the shorter About paragraph pulled Projects up the page. */
const bioSavings = 28;

const lineOpacity = 0.14;
const bleedGradientId = "sparras-dev-line-bleed";
const avatarClipId = "sparras-dev-avatar";

/**
 * The stops of `.border-b-bleed` at this window size: faint for most of the
 * way out from the column, then gone by the edge of the window.
 */
const bleedStops = [
  { offset: 0, strength: 0 },
  { offset: 153.6, strength: 0.15 },
  { offset: 256, strength: 1 },
  { offset: 1024, strength: 1 },
  { offset: 1126.4, strength: 0.15 },
  { offset: 1280, strength: 0 },
];

/**
 * Each loop ends with the card filling the picture, which looks exactly like
 * the top of the page, so starting over cannot be seen.
 */
function useEndlessDive(isPlaying: boolean) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldPlay = isPlaying && !prefersReducedMotion;
  const zoomRef = useRef<SVGGElement>(null);
  const scrollRef = useRef<SVGGElement>(null);
  const settleFrame = useRef(0);

  useEffect(() => {
    const zoomGroup = zoomRef.current;
    const scrollGroup = scrollRef.current;
    if (!zoomGroup || !scrollGroup || !shouldPlay) return;

    const show = (progress: number) => {
      const { scrolled, zoom } = sceneView(progress);
      scrollGroup.setAttribute("transform", `translate(0 ${-scrolled})`);
      zoomGroup.setAttribute(
        "transform",
        `translate(${zoom.x} ${zoom.y}) scale(${zoom.scale})`,
      );
    };

    cancelAnimationFrame(settleFrame.current);

    const startedAt = performance.now();
    let progress = 0;
    let frame = 0;
    const dive = (now: number) => {
      progress = ((now - startedAt) / loopDuration) % 1;
      show(progress);
      frame = requestAnimationFrame(dive);
    };
    frame = requestAnimationFrame(dive);

    return () => {
      cancelAnimationFrame(frame);

      const leftFrom = progress;
      const leftAt = performance.now();
      const settle = (now: number) => {
        const time = Math.min(1, (now - leftAt) / settleDuration);
        show(leftFrom * (1 - time) ** 3);
        if (time < 1) settleFrame.current = requestAnimationFrame(settle);
      };
      settleFrame.current = requestAnimationFrame(settle);
    };
  }, [shouldPlay]);

  return { zoomRef, scrollRef };
}

function Rule({ y }: { y: number }) {
  return (
    <rect
      y={y}
      width={viewport.width}
      height={1}
      fill={`url(#${bleedGradientId})`}
    />
  );
}

function Line({
  x,
  y,
  width,
  height = 7,
  opacity = 0.4,
}: {
  x: number;
  y: number;
  width: number;
  height?: number;
  opacity?: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="#fff"
      opacity={opacity}
    />
  );
}

function ColumnBorders({ height }: { height: number }) {
  return (
    <>
      <rect
        x={column.left}
        width={1}
        height={height}
        fill="#fff"
        opacity={lineOpacity}
      />
      <rect
        x={column.right}
        width={1}
        height={height}
        fill="#fff"
        opacity={lineOpacity}
      />
    </>
  );
}

function NavBar() {
  return (
    <>
      <rect width={viewport.width} height={navHeight} fill="#000" />
      <ColumnBorders height={navHeight} />
      <Line x={288} y={17} width={22} height={22} opacity={1} />
      <Line x={343} y={25} width={54} opacity={0.75} />
      <Line x={417} y={25} width={74} opacity={0.75} />
      <Line x={512} y={25} width={73} opacity={0.75} />
      <Line x={604} y={25} width={36} opacity={0.75} />
      <rect x={739} y={10} width={97} height={36} rx={8} fill="#fff" />
      <rect x={752} y={20} width={16} height={16} fill="#000" />
      <rect x={776} y={25} width={48} height={6} fill="#000" />
      <rect x={837} y={10} width={36} height={36} rx={8} fill="#fff" />
      <path d="M849 25l6 6 6-6" fill="none" stroke="#000" strokeWidth={2} />
      <rect
        x={881}
        y={10}
        width={74}
        height={36}
        rx={8}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.3}
      />
      <Line x={893} y={25} width={50} height={6} opacity={0.9} />
      <Line x={972} y={19} width={18} height={18} opacity={0.75} />
      <Rule y={navHeight - 1} />
    </>
  );
}

function ProfileArea() {
  return (
    <>
      {blackHoleLayers.map(({ fill, d }) => (
        <path key={fill} d={d} fill={fill} />
      ))}
      <rect
        x={column.left}
        y={211}
        width={152}
        height={152}
        fill="#000"
        stroke="#fff"
        strokeOpacity={lineOpacity}
      />
      <circle
        cx={332}
        cy={287}
        r={76}
        fill="#000"
        stroke="#fff"
        strokeOpacity={lineOpacity}
      />
      <g clipPath={`url(#${avatarClipId})`} fill="#fff" opacity={0.75}>
        <circle cx={332} cy={266} r={27} />
        <ellipse cx={332} cy={366} rx={64} ry={60} />
      </g>
      <rect x={409} y={278} width={615} height={1} fill="#fff" opacity={0.14} />
      <Line x={422} y={296} width={214} height={19} opacity={1} />
      <Line x={646} y={306} width={52} height={7} />
      <rect x={409} y={326} width={615} height={1} fill="#fff" opacity={0.14} />
      <Line x={422} y={340} width={152} height={8} />
      {[917, 943, 969, 995].map((x) => (
        <Line key={x} x={x} y={338} width={12} height={12} opacity={0.9} />
      ))}
      <Rule y={363} />
    </>
  );
}

function Availability() {
  return (
    <>
      <rect
        x={column.left}
        y={364}
        width={column.right - column.left}
        height={45}
        fill="#fff"
        opacity={0.05}
      />
      <circle cx={284} cy={386} r={3} fill="#fff" />
      <Line x={296} y={381} width={246} height={9} opacity={1} />
      <Line x={553} y={383} width={362} height={7} />
      <Rule y={409} />
    </>
  );
}
const overviewRows = [
  { y: 496, width: 150 },
  { y: 526, width: 140 },
  { y: 556, width: 124 },
];

function ProfileOverview() {
  return (
    <>
      {[gutter, 664].map((x) =>
        overviewRows.map(({ y, width }) => (
          <g key={`${x}-${y}`}>
            <Line x={x} y={y + 3} width={14} height={14} opacity={0.5} />
            <Line x={x + 26} y={y + 7} width={width} opacity={0.75} />
          </g>
        )),
      )}
      <rect x={640} y={473} width={1} height={128} fill="#fff" opacity={0.14} />
      <Rule y={601} />
    </>
  );
}

const bioLines = [
  { y: 635, width: 628 },
  { y: 663, width: 658 },
  { y: 691, width: 693 },
  { y: 719, width: 147 },
];

function AboutParagraph() {
  return (
    <>
      {bioLines.map(({ y, width }) => (
        <Line
          key={y}
          x={gutter}
          y={y}
          width={width}
          height={8}
          opacity={0.75}
        />
      ))}
      <Rule y={762} />
    </>
  );
}

function ProjectCard({
  x,
  y,
  title,
  description,
  badgeRows,
  children,
}: {
  x: number;
  y: number;
  title: number;
  description: readonly number[];
  /** Pill widths per row, the last row sitting at the bottom of the card. */
  badgeRows: readonly (readonly number[])[];
  children?: ReactNode;
}) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={351}
        height={371}
        rx={16}
        fill="#0b0b0b"
        stroke="#fff"
        strokeOpacity={0.14}
      />
      <g transform={`translate(${x + 1} ${y + 1})`}>{children}</g>
      <rect
        x={x}
        y={y + 176}
        width={351}
        height={1}
        fill="#fff"
        opacity={0.14}
      />
      <Line x={x + 17} y={y + 202} width={title} height={12} opacity={1} />
      <circle
        cx={x + 318}
        cy={y + 208}
        r={16}
        stroke="#fff"
        strokeOpacity={0.25}
      />
      <path
        d={`M${x + 313} ${y + 213}l10-10m-7 0h7v7`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.7}
        strokeWidth={1.5}
      />
      {description.map((width, row) => (
        <Line
          key={width}
          x={x + 17}
          y={y + 240 + row * 24}
          width={width}
          height={8}
        />
      ))}
      {badgeRows.map((widths, row) => {
        const top = y + 330 - (badgeRows.length - 1 - row) * 30;
        let left = x + 17;

        return widths.map((width) => {
          const pill = { x: left, width };
          left += width + 6;

          return (
            <g key={`${top}-${pill.x}`}>
              <rect
                x={pill.x}
                y={top}
                width={width}
                height={24}
                rx={12}
                stroke="#fff"
                strokeOpacity={0.14}
              />
              <Line
                x={pill.x + 9}
                y={top + 6}
                width={12}
                height={12}
                opacity={0.8}
              />
              <Line
                x={pill.x + 27}
                y={top + 9}
                width={width - 38}
                height={6}
                opacity={0.45}
              />
            </g>
          );
        });
      })}
    </>
  );
}

function MiniWinland() {
  return (
    <>
      <rect width={349} height={175} fill="#000" />
      <rect x={7} y={7} width={163} height={152} fill="#141414" stroke="#fff" />
      <g fill="#0f0f0f" stroke="#fff" strokeOpacity={0.25}>
        <rect x={175} y={7} width={167} height={74} />
        <rect x={175} y={86} width={81} height={73} />
        <rect x={261} y={86} width={81} height={73} />
      </g>
      <g fill="#fff" opacity={0.5}>
        <rect x={18} y={26} width={84} height={3} />
        <rect x={18} y={36} width={120} height={3} />
        <rect x={18} y={46} width={72} height={3} />
        <rect x={18} y={56} width={104} height={3} />
      </g>
      <g fill="#fff" opacity={0.25}>
        <rect x={186} y={26} width={104} height={3} />
        <rect x={186} y={36} width={76} height={3} />
        <rect x={186} y={104} width={48} height={3} />
        <rect x={272} y={104} width={52} height={3} />
      </g>
      <rect x={154} y={165} width={5} height={2} fill="#fff" />
      <rect x={161} y={165} width={34} height={2} fill="#fff" opacity={0.2} />
    </>
  );
}

function MiniWinshell() {
  return (
    <>
      <rect width={349} height={175} fill="#000" />
      <rect
        x={7}
        y={7}
        width={19}
        height={161}
        rx={4}
        fill="#141414"
        stroke="#fff"
        strokeOpacity={0.25}
      />
      <rect x={12} y={66} width={9} height={11} rx={4} fill="#fff" />
      <g fill="#fff">
        <rect x={62} y={66} width={92} height={32} />
      </g>
      <g fill="#141414" stroke="#fff" strokeOpacity={0.25}>
        <rect x={212} y={35} width={130} height={51} rx={4} />
        <rect x={212} y={91} width={130} height={51} rx={4} />
      </g>
      <rect
        x={219}
        y={42}
        width={37}
        height={37}
        rx={3}
        fill="#fff"
        opacity={0.2}
      />
      <rect x={262} y={49} width={58} height={3} fill="#fff" />
      <g fill="#fff" opacity={0.75}>
        {[
          219, 227, 235, 243, 251, 259, 267, 275, 283, 291, 299, 307, 315, 323,
        ].map((x, column) => {
          const height = 10 + ((column * 37) % 25);
          return (
            <rect key={x} x={x} y={136 - height} width={4} height={height} />
          );
        })}
      </g>
    </>
  );
}

function ProjectsSection() {
  return (
    <>
      <Line x={gutter} y={808} width={91} height={18} opacity={1} />
      <Rule y={847} />
      <ProjectCard
        x={281}
        y={871}
        title={79}
        description={[312, 118]}
        badgeRows={[[52, 62]]}
      >
        <MiniWinland />
      </ProjectCard>
      <ProjectCard
        x={648}
        y={871}
        title={86}
        description={[316, 164]}
        badgeRows={[[52, 62]]}
      >
        <MiniWinshell />
      </ProjectCard>
      <ProjectCard
        x={281}
        y={1258}
        title={108}
        description={[302, 176]}
        badgeRows={[
          [78, 102],
          [120, 94, 56],
        ]}
      />
    </>
  );
}

/** Everything the scroll can reach, so nothing below the card is drawn. */
function Page() {
  return (
    <>
      <rect width={viewport.width} height={pageHeight} fill="#000" />
      <ColumnBorders height={pageHeight} />
      <ProfileArea />
      <Availability />
      <g transform={`translate(0 ${-bannerSavings})`}>
        <ProfileOverview />
        <AboutParagraph />
        <g transform={`translate(0 ${-bioSavings})`}>
          <ProjectsSection />
        </g>
      </g>
      <NavBar />
    </>
  );
}

/** This site: scroll to its own card and dive in, to land on the site again. */
export function SparrasDevIllustration({
  alt,
  isPlaying,
}: {
  alt: string;
  isPlaying: boolean;
}) {
  const { zoomRef, scrollRef } = useEndlessDive(isPlaying);
  const pageId = useId();
  const navClipId = useId();
  const topClipId = useId();

  return (
    <svg
      role="img"
      aria-label={alt}
      className="absolute inset-0 size-full bg-black"
      preserveAspectRatio="xMidYMin slice"
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
    >
      <defs>
        <linearGradient
          id={bleedGradientId}
          gradientUnits="userSpaceOnUse"
          x1={0}
          x2={viewport.width}
          y1={0}
          y2={0}
        >
          {bleedStops.map(({ offset, strength }) => (
            <stop
              key={offset}
              offset={offset / viewport.width}
              stopColor="#fff"
              stopOpacity={strength * lineOpacity}
            />
          ))}
        </linearGradient>
        <clipPath id={avatarClipId}>
          <circle cx={332} cy={287} r={76} />
        </clipPath>
        <g id={pageId}>
          <Page />
        </g>
        <clipPath id={navClipId}>
          <rect width={viewport.width} height={navHeight} />
        </clipPath>
        <clipPath id={topClipId}>
          <rect width={viewport.width} height={viewport.height} />
        </clipPath>
      </defs>
      <g ref={zoomRef}>
        <g ref={scrollRef}>
          <use href={`#${pageId}`} />
          <g
            transform={`translate(${ownCard.x} ${ownCard.y}) scale(${ownCard.width / viewport.width})`}
          >
            <use href={`#${pageId}`} clipPath={`url(#${topClipId})`} />
          </g>
        </g>
        <use href={`#${pageId}`} clipPath={`url(#${navClipId})`} />
      </g>
    </svg>
  );
}
