export function formatTimestamp(startMs: number): { seconds: number; label: string } {
  const seconds = Math.max(0, Math.floor(startMs / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return {
    seconds,
    label: [hours, minutes, remainder].map((value) => String(value).padStart(2, "0")).join(":")
  };
}
