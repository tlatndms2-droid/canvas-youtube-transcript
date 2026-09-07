import { describe, expect, it } from "vitest";
import { TRANSCRIPT_SIZE } from "../src/placement";

describe("transcript placement", () => {
  it("uses one fixed preview and transcript-card size", () => {
    expect(TRANSCRIPT_SIZE).toEqual({ width: 700, height: 800 });
  });
});
