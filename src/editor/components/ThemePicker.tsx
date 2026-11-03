import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { THEMES, applyTheme, readTheme, type ThemeId } from "@/lib/theme";

export function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId>("crimson");
  useEffect(() => setTheme(readTheme()), []);
  return (
    <label className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-muted-foreground" title="Theme">
      <Palette className="size-3.5" />
      <span className="sr-only">Theme</span>
      <select
        aria-label="Theme"
        value={theme}
        onChange={(e) => { const t = e.target.value as ThemeId; setTheme(t); applyTheme(t); }}
        className="bg-transparent text-xs font-semibold text-foreground outline-none"
      >
        {THEMES.map((t) => <option key={t.id} value={t.id} className="bg-popover">{t.label}</option>)}
      </select>
    </label>
  );
}
