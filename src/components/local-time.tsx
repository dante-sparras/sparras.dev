"use client";

import { useEffect, useState } from "react";
import { describeTimeGap } from "@/lib/time-gap";

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
      {` // ${describeTimeGap(now, timeZone, -now.getTimezoneOffset())}`}
    </span>
  );
}
