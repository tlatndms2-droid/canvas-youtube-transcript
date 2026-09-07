import { Menu, Notice, Plugin } from "obsidian";
import { applyTranscriptClass, CanvasNodeHandle, createTranscriptNode, getActiveCanvasContext, selectedNodeHasSingleYouTubeUrl, videoFromNode } from "./canvas-adapter";
import { renderTranscriptMarkdown } from "./transcript-markdown";
import { CaptionTrackModal } from "./track-modal";
import { UserFacingError } from "./types";
import { YouTubeCaptionProvider } from "./youtube-captions";

const COMMAND_ID = "extract-youtube-transcript-from-selected-canvas-card";

export default class CanvasYouTubeTranscriptPlugin extends Plugin {
  private readonly captionProvider = new YouTubeCaptionProvider();
  private readonly inFlightNodeIds = new Set<string>();

  async onload(): Promise<void> {
    this.addCommand({
      id: COMMAND_ID,
      name: "선택한 YouTube Canvas 카드의 자막 추출",
      checkCallback: (checking) => {
        try {
          const context = getActiveCanvasContext(this.app);
          if (!selectedNodeHasSingleYouTubeUrl(context.node)) return false;
          if (!checking) void this.extractFromNode(context.node);
          return true;
        } catch {
          return false;
        }
      }
    });

    this.registerEvent(
      (this.app.workspace.on as unknown as (name: string, callback: (menu: Menu, node: CanvasNodeHandle) => void) => import("obsidian").EventRef)("canvas:node-menu", (menu: Menu, node: CanvasNodeHandle) => {
        if (!selectedNodeHasSingleYouTubeUrl(node)) return;
        menu.addItem((item) =>
          item.setTitle("YouTube 자막 추출").setIcon("captions").onClick(() => {
            void this.extractFromNode(node);
          })
        );
      })
    );
    this.registerEvent(this.app.workspace.on("layout-change", () => applyTranscriptClass(this.app)));
    applyTranscriptClass(this.app);
  }

  private async extractFromNode(node: CanvasNodeHandle): Promise<void> {
    if (this.inFlightNodeIds.has(node.id)) {
      new Notice("이미 자막을 가져오는 중입니다.");
      return;
    }
    this.inFlightNodeIds.add(node.id);
    try {
      const context = getActiveCanvasContext(this.app, node);
      const video = videoFromNode(node);
      new Notice("자막을 가져오는 중…", 5000);
      const data = await this.captionProvider.getVideoCaptionData(video.id);
      const track = data.tracks.length === 1 ? data.tracks[0] : await new CaptionTrackModal(this.app, data.tracks).choose();
      if (!track) return;
      const cues = await this.captionProvider.getTranscript(video.id, track);
      const content = renderTranscriptMarkdown(video, data.title, track, cues);
      createTranscriptNode(context, content);
      new Notice("Canvas에 자막 카드 1개를 만들었습니다.");
    } catch (error) {
      this.reportError(error);
    } finally {
      this.inFlightNodeIds.delete(node.id);
    }
  }

  private reportError(error: unknown): void {
    if (error instanceof UserFacingError) {
      console.error("[Canvas YouTube Transcript]", error.code, error.cause ?? error);
      new Notice(error.message);
      return;
    }
    console.error("[Canvas YouTube Transcript] Unexpected error", error);
    new Notice("자막 추출 중 예상하지 못한 문제가 발생했습니다.");
  }
}
