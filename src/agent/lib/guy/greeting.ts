export function displayName(metadata: Record<string, unknown> | undefined, fallback = "") {
  for (const key of ["full_name", "name", "preferred_username"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 80);
  }
  return fallback.trim().slice(0, 80);
}

export function greetingText(name: string) {
  return `${name.trim() ? `Hi, ${name.trim()}! ` : "Hi! "}What do you wanna create? Tell me your idea, the mood, and who it’s for. We can start from your files or create something new together.`;
}