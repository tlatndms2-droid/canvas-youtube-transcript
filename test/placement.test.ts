import { describe, expect, it } from "vitest";
import { findTranscriptPlacement, PLACEMENT_GAP, TRANSCRIPT_SIZE } from "../src/placement";

describe("transcript placement", () => {
  const source = { x: 0, y: 0, width: 400, height: 300 };

  it("places the card to the right when it is free", () => {
    expect(findTranscriptPlacement(source, [])).toMatchObject({ x: 400 + PLACEMENT_GAP, y: 0, ...TRANSCRIPT_SIZE });
  });

  it("uses the right-below slot when the immediate right is occupied", () => {
    const placement = findTranscriptPlacement(source, [{ x: 448, y: 0, width: 700, height: 800 }]);
    expect(placement.y).toBe(800 + PLACEMENT_GAP);
  });
});
