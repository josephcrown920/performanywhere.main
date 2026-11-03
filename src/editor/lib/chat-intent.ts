/** Detect when a chat message is a direct request to generate an image or video. */
export function generationIntent(text: string): "image" | "video" | null {
  const t = text.toLowerCase();
  if (!/\b(generate|create|make|render|produce|draw|paint|animate|shoot)\b/.test(t)) return null;
  if (/\b(video|clip|footage|animation|animate|film|shot of|seconds?|\d+\s?s)\b/.test(t)) return "video";
  if (/\b(image|photo|picture|pic|illustration|poster|portrait|still|render|artwork|draw|paint)\b/.test(t)) return "image";
  return null;
}
