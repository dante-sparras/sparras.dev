"use client";

import { useEffect, useState } from "react";

function offsetMinutes(timeZone: string, date: Date) {
  const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const zoned = new Date(date.toLocaleString("en-US", { timeZone }));
  return (zoned.getTime() - utc.getTime()) / 60_000;
}

function formatOffset(timeZone: string, date: Date) {
  const diffMinutes = offsetMinutes(timeZone, date) + date.getTimezoneOffset();
  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours === 0) {
    return "same time";
  }

  const hours = Math.abs(diffHours);
  return `${hours}h ${diffHours > 0 ? "ahead" : "behind"}`;
}

function formatTime(timeZone: string, date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function LocalTime({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) {
    return <span className="text-muted-foreground">Local time</span>;
  }

  return (
    <span>
      <span className="tabular-nums">{formatTime(timeZone, now)}</span>
      {` // ${formatOffset(timeZone, now)}`}
    </span>
  );
}
