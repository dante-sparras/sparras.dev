/** Everything in a scene is in the units of a 1200×600 illustration. */
export type Rect = { x: number; y: number; width: number; height: number };

/** Scales with the card, as long as the scene is inside an `@container`. */
export const units = (value: number) => `calc(${value} * 100cqw / 1200)`;

export const boxStyle = ({ x, y, width, height }: Rect) => ({
  left: units(x),
  top: units(y),
  width: units(width),
  height: units(height),
});
