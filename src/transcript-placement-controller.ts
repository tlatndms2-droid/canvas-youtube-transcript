import { Notice } from "obsidian";
import { CanvasContext, createTranscriptNode } from "./canvas-adapter";
import { TRANSCRIPT_SIZE } from "./placement";

interface PlacementSession {
  context: CanvasContext;
  content: string;
  overlay: HTMLElement;
}

/** Shows one temporary transcript card and waits for the user to choose its Canvas position. */
export class TranscriptPlacementController {
  private session: PlacementSession | null = null;
  private readonly onMove = (event: PointerEvent): void => this.move(event);
  private readonly onDown = (event: PointerEvent): void => this.place(event);
  private readonly onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      this.cancel();
    }
  };

  start(context: CanvasContext, content: string): void {
    this.cancel();
    const document = context.containerEl.ownerDocument;
    if (!document || !context.canvas.posFromClient) {
      new Notice("Canvas 위치 선택 화면을 열 수 없습니다.");
      return;
    }
    const overlay = document.body.createDiv({ cls: "cyt-transcript-placement" });
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.width = `${TRANSCRIPT_SIZE.width}px`;
    overlay.style.height = `${TRANSCRIPT_SIZE.height}px`;
    overlay.createDiv({ cls: "cyt-transcript-placement__label", text: "여기를 클릭해 자막 카드를 만들기" });
    this.session = { context, content, overlay };
    document.addEventListener("pointermove", this.onMove, true);
    document.addEventListener("pointerdown", this.onDown, true);
    document.addEventListener("keydown", this.onKey, true);
    new Notice("Canvas에서 자막 카드를 만들 위치를 클릭하세요. Esc를 누르면 취소됩니다.");
  }

  cancel(): void {
    const session = this.session;
    if (!session) return;
    const document = session.overlay.ownerDocument;
    document.removeEventListener("pointermove", this.onMove, true);
    document.removeEventListener("pointerdown", this.onDown, true);
    document.removeEventListener("keydown", this.onKey, true);
    session.overlay.remove();
    this.session = null;
  }

  private move(event: PointerEvent): void {
    const session = this.session;
    if (!session || !session.context.containerEl.contains(event.target as Node)) return;
    const position = session.context.canvas.posFromClient?.({ x: event.clientX, y: event.clientY });
    if (!position) return;
    const probe = session.context.canvas.posFromClient?.({ x: event.clientX + 20, y: event.clientY + 20 });
    const scale = probe && Math.abs(probe.x - position.x) > 0.001 ? 20 / Math.abs(probe.x - position.x) : 1;
    session.overlay.style.left = `${event.clientX}px`;
    session.overlay.style.top = `${event.clientY}px`;
    session.overlay.style.transform = `scale(${scale})`;
  }

  private place(event: PointerEvent): void {
    const session = this.session;
    if (!session || event.button !== 0 || !session.context.containerEl.contains(event.target as Node)) return;
    const position = session.context.canvas.posFromClient?.({ x: event.clientX, y: event.clientY });
    if (!position) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      createTranscriptNode(session.context, session.content, position);
      new Notice("Canvas에 자막 카드 1개를 만들었습니다.");
    } finally {
      this.cancel();
    }
  }
}
