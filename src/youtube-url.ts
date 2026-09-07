import { UserFacingError, YouTubeVideo } from "./types";

const URL_PATTERN = /https?:\/\/[^\s<>"'`\])}]+/gi;
const VALID_ID = /^[A-Za-z0-9_-]{6,}$/;

export function parseYouTubeUrl(value: string): YouTubeVideo | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(segments[0] ?? "")) id = segments[1] ?? null;
  }

  if (!id) return null;
  if (!VALID_ID.test(id)) {
    throw new UserFacingError("invalid-url", "YouTube 영상 주소가 올바르지 않습니다.");
  }
  return { id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` };
}

export function findYouTubeVideos(text: string): YouTubeVideo[] {
  const values = text.match(URL_PATTERN) ?? [];
  const found = new Map<string, YouTubeVideo>();
  for (const value of values) {
    const video = parseYouTubeUrl(value);
    if (video) found.set(video.id, video);
  }
  return [...found.values()];
}

export function requireSingleYouTubeVideo(values: string[]): YouTubeVideo {
  const found = new Map<string, YouTubeVideo>();
  for (const value of values) {
    for (const video of findYouTubeVideos(value)) found.set(video.id, video);
  }
  if (found.size === 0) {
    throw new UserFacingError("url-not-found", "선택한 카드에서 YouTube 주소를 찾을 수 없습니다.");
  }
  if (found.size > 1) {
    throw new UserFacingError("invalid-url", "선택한 카드에 서로 다른 YouTube 영상 주소가 여러 개 있습니다.");
  }
  return [...found.values()][0];
}
