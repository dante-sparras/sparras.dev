"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locale";
import { describeTimeGap, type TimeGapLabels } from "@/lib/time-gap";

function formatTime(locale: Locale, timeZone: string, date: Date) {
  return new Intl.DateTimeFormat(locale === "sv" ? "sv-SE" : "en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale !== "sv",
  }).format(date);
}

export function LocalTime({
  locale,
  timeZone,
  labels,
}: {
  locale: Locale;
  timeZone: string;
  labels: TimeGapLabels & { localTime: string };
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) {
    return <span className="text-muted-foreground">{labels.localTime}</span>;
  }

  return (
    <span>
      <span className="tabular-nums">{formatTime(locale, timeZone, now)}</span>
      {` // ${describeTimeGap(now, timeZone, -now.getTimezoneOffset(), labels)}`}
    </span>
  );
}
