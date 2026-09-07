export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TRANSCRIPT_SIZE = { width: 700, height: 800 };
export const PLACEMENT_GAP = 48;

function overlaps(left: CanvasRect, right: CanvasRect): boolean {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
}

export function findTranscriptPlacement(source: CanvasRect, existing: CanvasRect[]): CanvasRect {
  const rightX = source.x + source.width + PLACEMENT_GAP;
  const belowY = source.y + source.height + PLACEMENT_GAP;
  const aboveY = source.y - TRANSCRIPT_SIZE.height - PLACEMENT_GAP;
  const candidates: CanvasRect[] = [{ x: rightX, y: source.y, ...TRANSCRIPT_SIZE }];
  for (let ring = 1; ring <= 32; ring += 1) {
    const offset = ring * (TRANSCRIPT_SIZE.height + PLACEMENT_GAP);
    candidates.push({ x: rightX, y: source.y + offset, ...TRANSCRIPT_SIZE });
    candidates.push({ x: rightX, y: source.y - offset, ...TRANSCRIPT_SIZE });
  }
  candidates.push({ x: source.x, y: belowY, ...TRANSCRIPT_SIZE });
  candidates.push({ x: source.x, y: aboveY, ...TRANSCRIPT_SIZE });
  const open = candidates.find((candidate) => !existing.some((rect) => overlaps(candidate, rect)));
  if (open) return open;
  const farRight = Math.max(source.x + source.width, ...existing.map((rect) => rect.x + rect.width));
  return { x: farRight + PLACEMENT_GAP, y: source.y, ...TRANSCRIPT_SIZE };
}
