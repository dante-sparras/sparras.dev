"use client";

import { ChoiceMenu } from "@/components/choice-menu";
import { useStoredPreference } from "@/hooks/use-stored-preference";
import { formatTemperature, type TemperatureUnit } from "@/lib/weather";

const UNITS = ["C", "F"] as const satisfies readonly TemperatureUnit[];

export function Temperature({
  celsius,
  condition,
  labels,
}: {
  celsius: number;
  /** Localized weather condition, e.g. "cloudy". */
  condition: string;
  labels: { menu: string; celsius: string; fahrenheit: string };
}) {
  const [unit, setUnit] = useStoredPreference<TemperatureUnit>(
    "temperature-unit",
    UNITS,
    "C",
  );

  return (
    <>
      <ChoiceMenu
        label={labels.menu}
        choices={[
          { value: "C", label: labels.celsius },
          { value: "F", label: labels.fahrenheit },
        ]}
        value={unit}
        onValueChange={setUnit}
      >
        <span className="tabular-nums">{formatTemperature(celsius, unit)}</span>
      </ChoiceMenu>
      <span className="sr-only">{` ${condition}`}</span>
    </>
  );
}
