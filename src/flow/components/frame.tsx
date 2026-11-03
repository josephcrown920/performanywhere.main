import { FRAME_IMAGES, type FrameKey, type Tint } from "@/flow/data/demo";
import { cn } from "@/lib/utils";

const TINT_OVERLAYS: Record<Tint, string | null> = {
  violet: "bg-holo-violet/25",
  cyan: "bg-holo-cyan/25",
  magenta: "bg-holo-magenta/25",
  amber: "bg-holo-amber/25",
  none: null,
};

export function FrameImage({
  frame,
  tint = "none",
  className,
  imgClassName,
  grain = true,
  loading = "lazy",
}: {
  frame: FrameKey;
  tint?: Tint;
  className?: string;
  imgClassName?: string;
  grain?: boolean;
  loading?: "lazy" | "eager";
}) {
  const overlay = TINT_OVERLAYS[tint];
  return (
    <div className={cn("relative overflow-hidden bg-secondary", grain && "film-grain", className)}>
      <img
        src={FRAME_IMAGES[frame]}
        alt=""
        loading={loading}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
      {overlay && <div className={cn("absolute inset-0 mix-blend-color", overlay)} />}
      <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
    </div>
  );
}

/** Prismatic gradient placeholder portrait for newly created characters. */
export function PrismaticPortrait({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  const hue = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  return (
    <div
      className={cn("film-grain relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(140deg, oklch(0.55 0.2 ${hue}), oklch(0.35 0.12 ${(hue + 80) % 360}), oklch(0.25 0.08 ${(hue + 180) % 360}))`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center font-display text-3xl uppercase text-foreground/80">
        {seed.slice(0, 1) || "?"}
      </div>
    </div>
  );
}
