import { App } from "obsidian";
import { CanvasRect, findTranscriptPlacement } from "./placement";
import { UserFacingError } from "./types";
import { requireSingleYouTubeVideo } from "./youtube-url";

export interface CanvasNodeHandle extends CanvasRect {
  id: string;
  url?: string;
  text?: string;
  getData?: () => Record<string, unknown>;
  setData?: (data: Record<string, unknown>) => void;
  nodeEl?: HTMLElement;
}

interface CanvasHandle {
  nodes: Map<string, CanvasNodeHandle> | Record<string, CanvasNodeHandle>;
  selection?: Set<CanvasNodeHandle | string>;
  createTextNode?: (options: { pos: { x: number; y: number }; size: { width: number; height: number }; text: string; focus: boolean }) => CanvasNodeHandle;
  requestSave?: () => void;
}

export interface CanvasContext {
  canvas: CanvasHandle;
  node: CanvasNodeHandle;
}

function enableTranscriptScrolling(node: CanvasNodeHandle): void {
  const element = node.nodeEl;
  if (!element) return;
  element.dataset.cytTranscriptScroll = "true";
  if (document.documentElement.dataset.cytTranscriptWheelGuard === "true") return;
  document.documentElement.dataset.cytTranscriptWheelGuard = "true";
  document.addEventListener(
    "wheel",
    (event) => {
      const target = event.target as HTMLElement | null;
      const preview = target?.closest<HTMLElement>(".cyt-transcript-node .markdown-preview-view");
      if (!preview || preview.scrollHeight <= preview.clientHeight) return;
      // Canvas handles wheel input before the card can scroll; leave this event to the card instead.
      event.stopImmediatePropagation();
    },
    { capture: true, passive: true }
  );
}

function nodesOf(canvas: CanvasHandle): CanvasNodeHandle[] {
  return canvas.nodes instanceof Map ? [...canvas.nodes.values()] : Object.values(canvas.nodes);
}

function selectedNodes(canvas: CanvasHandle): CanvasNodeHandle[] {
  if (canvas.selection instanceof Set && canvas.selection.size) {
    return [...canvas.selection].map((item) => (typeof item === "string" ? nodesOf(canvas).find((node) => node.id === item) : item)).filter((item): item is CanvasNodeHandle => Boolean(item));
  }
  return nodesOf(canvas).filter((node) => Boolean((node as CanvasNodeHandle & { isSelected?: () => boolean }).isSelected?.()));
}

export function getActiveCanvasContext(app: App, node?: CanvasNodeHandle): CanvasContext {
  const view = app.workspace.getActiveViewOfType as unknown as (type: unknown) => unknown;
  const activeView = view.call(app.workspace, Object) as { getViewType?: () => string; canvas?: CanvasHandle } | null;
  const canvas = activeView?.getViewType?.() === "canvas" ? activeView.canvas : undefined;
  if (!canvas) throw new UserFacingError("canvas-not-found", "현재 열려 있는 Canvas를 찾을 수 없습니다.");
  const selected = node ? [node] : selectedNodes(canvas);
  if (selected.length !== 1) {
    throw new UserFacingError("url-not-found", "YouTube 카드 하나를 선택한 뒤 다시 실행해 주세요.");
  }
  return { canvas, node: selected[0] };
}

export function selectedNodeHasSingleYouTubeUrl(node: CanvasNodeHandle): boolean {
  try {
    videoFromNode(node);
    return true;
  } catch {
    return false;
  }
}

export function videoFromNode(node: CanvasNodeHandle) {
  const data = node.getData?.() ?? {};
  const candidates = [node.url, node.text, typeof data.url === "string" ? data.url : undefined, typeof data.text === "string" ? data.text : undefined].filter((value): value is string => Boolean(value));
  return requireSingleYouTubeVideo(candidates);
}

export function createTranscriptNode(context: CanvasContext, content: string): CanvasNodeHandle {
  const { canvas, node } = context;
  if (!canvas.createTextNode) {
    throw new UserFacingError("canvas-node-create-failed", "현재 Obsidian에서 자막 카드를 만들 수 없습니다.");
  }
  const placement = findTranscriptPlacement(node, nodesOf(canvas).filter((candidate) => candidate.id !== node.id));
  try {
    const created = canvas.createTextNode({ pos: { x: placement.x, y: placement.y }, size: { width: placement.width, height: placement.height }, text: content, focus: false });
    const data = created.getData?.() ?? {};
    created.setData?.({ ...data, cytTranscript: true });
    created.nodeEl?.addClass("cyt-transcript-node");
    enableTranscriptScrolling(created);
    canvas.requestSave?.();
    return created;
  } catch (error) {
    throw new UserFacingError("canvas-node-create-failed", "자막 카드를 만들지 못했습니다.", error);
  }
}

export function applyTranscriptClass(app: App): void {
  const view = app.workspace.getActiveViewOfType as unknown as (type: unknown) => unknown;
  const activeView = view.call(app.workspace, Object) as { getViewType?: () => string; canvas?: CanvasHandle } | null;
  if (activeView?.getViewType?.() !== "canvas" || !activeView.canvas) return;
  for (const node of nodesOf(activeView.canvas)) {
    if (node.getData?.().cytTranscript === true) {
      node.nodeEl?.addClass("cyt-transcript-node");
      enableTranscriptScrolling(node);
    }
  }
}
