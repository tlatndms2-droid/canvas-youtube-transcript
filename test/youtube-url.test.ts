import { describe, expect, it } from "vitest";
import { findYouTubeVideos, parseYouTubeUrl, requireSingleYouTubeVideo } from "../src/youtube-url";

describe("YouTube URL parsing", () => {
  it.each([
    "https://www.youtube.com/watch?v=Kf1dYpnH-N4&t=61s",
    "https://youtu.be/Kf1dYpnH-N4?t=61",
    "https://www.youtube.com/embed/Kf1dYpnH-N4#t=61",
    "https://www.youtube.com/shorts/Kf1dYpnH-N4"
  ])("keeps the video ID for %s", (url) => {
    expect(parseYouTubeUrl(url)).toEqual({ id: "Kf1dYpnH-N4", canonicalUrl: "https://www.youtube.com/watch?v=Kf1dYpnH-N4" });
  });

  it("finds URLs embedded in Canvas text", () => {
    expect(findYouTubeVideos("Watch https://youtu.be/Kf1dYpnH-N4?t=61 now")).toHaveLength(1);
  });

  it("rejects multiple videos", () => {
    expect(() => requireSingleYouTubeVideo(["https://youtu.be/Kf1dYpnH-N4 https://youtu.be/dQw4w9WgXcQ"])).toThrow("여러 개");
  });
});
