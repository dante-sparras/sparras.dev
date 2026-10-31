import { describe, expect, test } from "bun:test";
import {
  blackHoleLayers,
  loopDuration,
  navHeight,
  ownCard,
  sceneView,
  scrollDistance,
  viewport,
} from "@/lib/sparras-scene";

describe("the sparras.dev scene", () => {
  test("starts at the top of the page", () => {
    const { scrolled, zoom } = sceneView(0);
    expect(scrolled).toBe(0);
    expect(zoom.scale).toBe(1);
    expect(zoom.x).toBeCloseTo(0);
    expect(zoom.y).toBeCloseTo(0);
  });

  test("brings the card into view below the nav before it zooms", () => {
    const { scrolled, zoom } = sceneView(1150 / loopDuration);
    expect(zoom.scale).toBe(1);
    expect(scrolled).toBeCloseTo(scrollDistance);
    expect(ownCard.y - scrolled).toBeGreaterThanOrEqual(navHeight);
    expect(ownCard.y + ownCard.height - scrolled).toBeLessThanOrEqual(
      viewport.height,
    );
  });

  test("ends with the card filling the picture, so the loop has no jump", () => {
    const { scrolled, zoom } = sceneView(1);
    const left = ownCard.x * zoom.scale + zoom.x;
    const top = (ownCard.y - scrolled) * zoom.scale + zoom.y;

    expect(left).toBeCloseTo(0);
    expect(top).toBeCloseTo(0);
    expect(left + ownCard.width * zoom.scale).toBeCloseTo(viewport.width);
    expect(top + ownCard.height * zoom.scale).toBeCloseTo(viewport.height);
  });

  test("keeps the card's copy of the page free of the card itself", () => {
    expect(ownCard.y).toBeGreaterThanOrEqual(viewport.height);
  });

  test("gives the black hole its color", () => {
    expect(blackHoleLayers.length).toBeGreaterThan(3);
  });
});
