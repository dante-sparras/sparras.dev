/** Offset of `timeZone` from UTC at `instant`, in minutes east. */
function zoneOffsetMinutes(instant: Date, timeZone: string) {
  const zoneName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName")?.value;

  // "GMT" alone means UTC; otherwise "GMT+02:00" / "GMT-03:30".
  const match = zoneName?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) {
    return 0;
  }
  const [, sign, hours, minutes] = match;
  return (sign === "-" ? -1 : 1) * (Number(hours) * 60 + Number(minutes));
}

/**
 * How far `timeZone` is from the visitor at `instant`, e.g. "2h ahead",
 * "3h 30m behind" or "same time".
 */
export function describeTimeGap(
  instant: Date,
  timeZone: string,
  visitorUtcOffsetMinutes: number,
) {
  const gap = zoneOffsetMinutes(instant, timeZone) - visitorUtcOffsetMinutes;
  if (gap === 0) {
    return "same time";
  }

  const hours = Math.floor(Math.abs(gap) / 60);
  const minutes = Math.abs(gap) % 60;
  const amount = [hours && `${hours}h`, minutes && `${minutes}m`]
    .filter(Boolean)
    .join(" ");
  return `${amount} ${gap > 0 ? "ahead" : "behind"}`;
}
