/** Translate timeline seconds into source seconds, including playback speed. */
export function sourceTime(clip: { start: number; inPoint: number; speed: number }, timelineTime: number) {
  return Math.max(0, clip.inPoint + Math.max(0, timelineTime - clip.start) * clip.speed);
}