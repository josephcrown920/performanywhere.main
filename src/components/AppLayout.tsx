import { Link, useLocation } from "@/lib/nav";
import type { ReactNode } from "react";
import AuthGate from "@/components/AuthGate";
import BrandMark from "@/components/BrandMark";
import { Film, PlusSquare, Layers, Settings, Activity, Bot, Clapperboard, Scissors, Fingerprint } from "lucide-react";

const NAV = [
  { to: "/projects", label: "Library", Icon: Film },
  { to: "/studio", label: "New shoot", Icon: PlusSquare },
  { to: "/characters", label: "Characters", Icon: Fingerprint },
  { to: "/editor", label: "Editor", Icon: Scissors },
  { to: "/agent", label: "Video Agent", Icon: Bot },
  { to: "/flow/director", label: "Director", Icon: Clapperboard },
  { to: "/orchestrate", label: "Orchestrate", Icon: Layers },
  { to: "/motion-test", label: "Motion", Icon: Activity },
  { to: "/account", label: "Settings", Icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isActive = (p: string) => location === p || location.startsWith(p + "/");
  // Let visitors explore and prepare a shoot without creating an account.
  // Only account-owned cloud data stays behind authentication; paid generation
  // endpoints still verify the signed-in user server-side.
  const requiresAccount =
    location === "/account" ||
    location.startsWith("/projects") ||
    location.startsWith("/characters");

  return (
    <div className="pa-shell min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="shrink-0"><BrandMark size={34} /></Link>
          <nav className="flex items-center gap-0.5 overflow-x-auto text-sm">
            {NAV.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2 uppercase tracking-[0.12em] text-[11px] font-semibold transition-colors ${
                  isActive(to) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="hidden md:inline">{label}</span>
                {isActive(to) && <span className="absolute inset-x-2 -bottom-[13px] h-[2px] bg-primary" />}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {requiresAccount ? <AuthGate>{children}</AuthGate> : children}
    </div>
  );
}
