"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import {
  RgbSplitBorderOverlay,
  RgbSplitFilter,
  useRgbSplitHover,
} from "@/components/rgb-split";
import { cn } from "@/lib/utils";

export type ButtonHoverEffect = "rgb";

const RGB_SPLIT_PX = 3;
const RGB_GREEN_PX = 0.6;

const buttonVariants = cva(
  "group/button relative isolate inline-flex shrink-0 select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-md border border-transparent bg-clip-padding font-medium text-xs/relaxed outline-none transition-all before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[url('/halftone-background.png')] before:bg-center before:bg-cover before:opacity-0 before:transition-opacity hover:before:opacity-100 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[2px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 before:hidden hover:underline",
      },
      size: {
        default:
          "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        "icon-sm": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-8 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    hoverEffect?: ButtonHoverEffect;
    rgbSplitPx?: number;
    rgbGreenPx?: number;
    rgbTarget?: "content" | "border" | "both";
  };

function Button({
  hoverEffect,
  rgbSplitPx,
  rgbGreenPx,
  rgbTarget,
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  if (hoverEffect === "rgb") {
    return (
      <RgbSplitButton
        className={className}
        variant={variant}
        size={size}
        rgbSplitPx={rgbSplitPx}
        rgbGreenPx={rgbGreenPx}
        rgbTarget={rgbTarget}
        {...props}
      />
    );
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function RgbSplitButton({
  className,
  variant = "default",
  size = "default",
  rgbSplitPx = RGB_SPLIT_PX,
  rgbGreenPx = RGB_GREEN_PX,
  rgbTarget = "content",
  children,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  ...props
}: Omit<ButtonProps, "hoverEffect">) {
  const splitContent = rgbTarget === "content" || rgbTarget === "both";
  const splitBorder = rgbTarget === "border" || rgbTarget === "both";
  const contentSplit = useRgbSplitHover({
    splitPx: rgbSplitPx,
    greenPx: rgbGreenPx,
  });
  const borderSplit = useRgbSplitHover({
    splitPx: 1,
    greenPx: 0,
    enterDelayMs: 150,
  });

  const handlePointerEnter: NonNullable<
    ButtonPrimitive.Props["onPointerEnter"]
  > = (event) => {
    if (splitContent) {
      contentSplit.onPointerEnter(event);
    }
    if (splitBorder) {
      borderSplit.onPointerEnter(event);
    }
    onPointerEnter?.(event);
  };

  const handlePointerMove: NonNullable<
    ButtonPrimitive.Props["onPointerMove"]
  > = (event) => {
    if (splitContent) {
      contentSplit.onPointerMove(event);
    }
    if (splitBorder) {
      borderSplit.onPointerMove(event);
    }
    onPointerMove?.(event);
  };

  const handlePointerLeave: NonNullable<
    ButtonPrimitive.Props["onPointerLeave"]
  > = (event) => {
    if (splitContent) {
      contentSplit.onPointerLeave();
    }
    if (splitBorder) {
      borderSplit.onPointerLeave();
    }
    onPointerLeave?.(event);
  };

  return (
    <ButtonPrimitive
      data-slot="button"
      data-hover-effect="rgb"
      className={cn(
        buttonVariants({ variant, size, className }),
        "overflow-visible before:hidden",
        splitBorder && "border-transparent",
      )}
      {...props}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {splitContent ? (
        <RgbSplitFilter
          id={contentSplit.filterId}
          offsetRefs={contentSplit.offsetRefs}
        />
      ) : null}
      {splitBorder ? (
        <RgbSplitFilter
          id={borderSplit.filterId}
          offsetRefs={borderSplit.offsetRefs}
        />
      ) : null}
      {splitBorder ? (
        <RgbSplitBorderOverlay filterStyle={borderSplit.filterStyle} />
      ) : null}
      <span
        className={cn(
          "inline-flex items-center justify-center gap-[inherit]",
          splitBorder && "relative z-10",
        )}
        style={splitContent ? contentSplit.filterStyle : undefined}
      >
        {children}
      </span>
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
