"use client";

import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Choice<T extends string> = { value: T; label: string };

/**
 * Wraps `children` in an inline button that opens a small menu for
 * picking one of `choices`.
 */
export function ChoiceMenu<T extends string>({
  label,
  choices,
  value,
  onValueChange,
  children,
}: {
  label: string;
  choices: readonly Choice<T>[];
  value: T;
  onValueChange: (value: T) => void;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent aria-label={label} className="w-auto min-w-44">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            const choice = choices.find((entry) => entry.value === next);
            if (choice) onValueChange(choice.value);
          }}
        >
          {choices.map((choice) => (
            <DropdownMenuRadioItem
              key={choice.value}
              value={choice.value}
              closeOnClick
            >
              {choice.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
