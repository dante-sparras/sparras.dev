"use client";

import Image from "next/image";
import {
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const ARTBOARD_WIDTH = 2160;
const RADIUS = 160;
const ZOOM = 1.05;
const FADE_START = 0.42;
const EASE = 12;

type Lens = {
  x: number;
  y: number;
  scale: number;
};

const IDLE: Lens = { x: 0.5, y: 0.5, scale: 0 };

function lensMask(radius: number, x: number, y: number) {
  return `radial-gradient(circle ${radius}px at ${x * 100}% ${y * 100}%, #000 ${FADE_START * 100}%, transparent 100%)`;
}

export function BlackHoleBanner() {
  const rootRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<Lens>(IDLE);
  const currentRef = useRef<Lens>(IDLE);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const [lens, setLens] = useState<Lens>(IDLE);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [width, setWidth] = useState(ARTBOARD_WIDTH);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const kick = useCallback(() => {
    if (rafRef.current != null) {
      return;
    }
    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;
      const k = 1 - Math.exp(-EASE * dt);
      const cur = currentRef.current;
      const tgt = targetRef.current;
      const next = {
        x: cur.x + (tgt.x - cur.x) * k,
        y: cur.y + (tgt.y - cur.y) * k,
        scale: cur.scale + (tgt.scale - cur.scale) * k,
      };
      currentRef.current = next;
      setLens(next);
      const settled =
        Math.abs(next.x - tgt.x) < 0.001 &&
        Math.abs(next.y - tgt.y) < 0.001 &&
        Math.abs(next.scale - tgt.scale) < 0.001;
      if (settled) {
        currentRef.current = tgt;
        setLens(tgt);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  const aim = useCallback(
    (event: PointerEvent<HTMLDivElement>, scale: number) => {
      if (reduceMotion) {
        return;
      }
      if (scale === 0) {
        targetRef.current = {
          x: currentRef.current.x,
          y: currentRef.current.y,
          scale: 0,
        };
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        targetRef.current = {
          x: (event.clientX - rect.left) / rect.width,
          y: (event.clientY - rect.top) / rect.height,
          scale,
        };
      }
      kick();
    },
    [kick, reduceMotion],
  );

  const radius = (RADIUS / ARTBOARD_WIDTH) * width;
  const showLens = !reduceMotion && lens.scale > 0.02;
  const mask = lensMask(radius, lens.x, lens.y);

  return (
    <div
      ref={rootRef}
      className="relative aspect-[2160/864] w-full touch-none select-none overflow-hidden bg-black"
      onPointerEnter={(event) => aim(event, 1)}
      onPointerMove={(event) => aim(event, 1)}
      onPointerLeave={(event) => aim(event, 0)}
    >
      <Image
        src="/banner/black-hole-banner.png"
        alt="Pixel black hole accretion disk"
        fill
        unoptimized
        priority
        sizes="(min-width: 768px) 48rem, 100vw"
        className="pointer-events-none object-cover [image-rendering:pixelated]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: showLens ? lens.scale : 0,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        <Image
          src="/banner/black-hole-banner-reveal.png"
          alt=""
          fill
          unoptimized
          priority
          sizes="(min-width: 768px) 48rem, 100vw"
          className="object-cover [image-rendering:pixelated]"
          style={{
            transform: `scale(${1 + (ZOOM - 1) * lens.scale})`,
            transformOrigin: `${lens.x * 100}% ${lens.y * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
