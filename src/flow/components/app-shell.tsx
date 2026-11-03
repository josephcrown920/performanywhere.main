import { Link, useRouterState } from "@tanstack/react-router";
import { Clapperboard, Users, Network, Sparkles, FolderKanban } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/flow/storyboard", label: "Storyboard", icon: Clapperboard },
  { to: "/flow/director", label: "AI Director", icon: Sparkles },
  { to: "/projects", label: "Perform Anywhere", icon: Users },
  { to: "/flow/canvas", label: "Canvas", icon: Network },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/flow/director" className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-holo-violet via-holo-magenta to-holo-cyan shadow-[0_0_18px_-2px] shadow-holo-violet/60">
        <FolderKanban className="h-4.5 w-4.5 text-foreground" strokeWidth={2.4} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-sm uppercase tracking-[0.18em] text-foreground">
          Perform <span className="holo-text">Anywhere</span>
        </span>
        <span className="font-head text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Director</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen bg-background">
      <div className="aurora opacity-60" />
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 font-head text-[13px] font-semibold uppercase tracking-wide transition-colors",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", active && "text-holo-violet")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <Link
            to="/flow/director"
            className="holo-edge inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-head text-[13px] font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            <Sparkles className="h-4 w-4" />
            New Scene
          </Link>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-3 md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 font-head text-xs font-semibold uppercase tracking-wide",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  );
}
