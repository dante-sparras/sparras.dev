"use client";

import { useEffect, useState } from "react";
import { ChoiceMenu } from "@/components/choice-menu";
import { useStoredPreference } from "@/hooks/use-stored-preference";
import type { Locale } from "@/i18n/locale";

type HourFormat = "24" | "12";

const HOUR_FORMATS = ["24", "12"] as const satisfies readonly HourFormat[];

function formatTime(
  locale: Locale,
  timeZone: string,
  date: Date,
  hourFormat: HourFormat,
) {
  // 12-hour time always uses en-US so it reads "03:32 AM" in both languages.
  if (hourFormat === "12") {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale === "sv" ? "sv-SE" : "en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** UTC offset of `timeZone` at `date`, e.g. "UTC +02:00". */
function formatUtcOffset(timeZone: string, date: Date) {
  const offset =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const [, sign = "+", time = "00:00"] =
    offset.match(/^GMT(?:([+\-−])(\d{2}:\d{2}))?$/) ?? [];

  return `UTC ${sign === "−" ? "-" : sign}${time}`;
}

export function LocalTime({
  locale,
  timeZone,
  labels,
}: {
  locale: Locale;
  timeZone: string;
  labels: { localTime: string; menu: string; hour24: string; hour12: string };
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [hourFormat, setHourFormat] = useStoredPreference<HourFormat>(
    "hour-format",
    HOUR_FORMATS,
    "24",
  );

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
      <ChoiceMenu
        label={labels.menu}
        choices={[
          { value: "24", label: labels.hour24 },
          { value: "12", label: labels.hour12 },
        ]}
        value={hourFormat}
        onValueChange={setHourFormat}
      >
        <span className="tabular-nums">
          {formatTime(locale, timeZone, now, hourFormat)}
        </span>
        {` (${formatUtcOffset(timeZone, now)})`}
      </ChoiceMenu>
    </span>
  );
}
