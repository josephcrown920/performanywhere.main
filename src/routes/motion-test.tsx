import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import AppLayout from "@/components/AppLayout";

export const Route = createFileRoute("/motion-test")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Motion test — Perform Anywhere" },
      { name: "description", content: "Check animation smoothness and frame rate on your device." },
      { property: "og:title", content: "Motion test — Perform Anywhere" },
      { property: "og:description", content: "Check animation smoothness and frame rate on your device." },
    ],
  }),
  component: MotionTest,
});

function useFps() {
  const [fps, setFps] = useState(0);
  const [drops, setDrops] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    let last = performance.now();
    let frames = 0;
    let windowStart = last;
    const tick = (t: number) => {
      if (t - last > 34) setDrops((d) => d + 1);
      last = t;
      frames++;
      if (t - windowStart >= 1000) {
        setFps(Math.round((frames * 1000) / (t - windowStart)));
        frames = 0;
        windowStart = t;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  return { fps, drops, reset: () => setDrops(0) };
}

const TESTS = ["Page swipe", "Card stack", "Spring buttons", "Orbit load"] as const;

function MotionTest() {
  const { fps, drops, reset } = useFps();
  const [test, setTest] = useState<(typeof TESTS)[number]>("Page swipe");
  const [page, setPage] = useState(0);
  const [stack, setStack] = useState([0, 1, 2, 3]);
  const good = fps >= 55;

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 py-8">
        <h1 className="font-display text-3xl font-semibold text-foreground">Motion test</h1>
        <p className="mt-1 text-sm text-muted-foreground">Run each test and watch the frame rate. 60 is perfectly smooth.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-glass rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">Frame rate</div>
            <div className={`font-mono text-3xl ${good ? "text-aurora-cyan" : "text-destructive"}`}>{fps}</div>
          </div>
          <button onClick={reset} className="bg-glass rounded-2xl p-4 text-left">
            <div className="text-xs text-muted-foreground">Dropped frames · tap to reset</div>
            <div className="font-mono text-3xl text-foreground">{drops}</div>
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TESTS.map((t) => (
            <button
              key={t}
              onClick={() => { setTest(t); reset(); }}
              className={`rounded-full px-4 py-2 text-sm transition ${test === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="bg-glass relative mt-6 h-80 overflow-hidden rounded-3xl">
          {test === "Page swipe" && (
            <>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={page}
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "-100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 32 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, i) => Math.abs(i.offset.x) > 60 && setPage((p) => p + 1)}
                  className="absolute inset-4 flex items-center justify-center rounded-2xl text-gradient font-display text-5xl font-bold"
                  style={{ background: "linear-gradient(135deg, hsl(var(--aurora-pink) / .15), hsl(var(--aurora-cyan) / .15))" }}
                >
                  Scene {page + 1}
                </motion.div>
              </AnimatePresence>
              <p className="absolute bottom-3 w-full text-center text-xs text-muted-foreground">Swipe the card</p>
            </>
          )}

          {test === "Card stack" && (
            <div className="absolute inset-0 flex items-center justify-center">
              {stack.map((id, i) => (
                <motion.div
                  key={id}
                  layout
                  drag={i === stack.length - 1}
                  dragSnapToOrigin
                  onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.x) > 80) setStack((s) => [s[s.length - 1], ...s.slice(0, -1)]);
                  }}
                  animate={{ scale: 1 - (stack.length - 1 - i) * 0.06, y: (stack.length - 1 - i) * -14 }}
                  className="absolute h-56 w-44 rounded-2xl border border-border bg-card"
                  style={{ zIndex: i, background: `linear-gradient(160deg, hsl(var(--aurora-${["pink", "purple", "cyan", "pink"][id]}) / .5), hsl(var(--card)))` }}
                />
              ))}
              <p className="absolute bottom-3 text-xs text-muted-foreground">Fling the top card away</p>
            </div>
          )}

          {test === "Spring buttons" && (
            <div className="grid h-full grid-cols-3 place-items-center p-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.8, rotate: -8 }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="h-16 w-16 rounded-2xl bg-primary/80"
                />
              ))}
            </div>
          )}

          {test === "Orbit load" && (
            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-3 w-3 rounded-full bg-aurora-cyan"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2 + (i % 5), ease: "linear" }}
                  style={{ originX: `${40 + i * 3}px`, opacity: 0.3 + (i % 7) / 10 }}
                />
              ))}
              <p className="absolute bottom-3 text-xs text-muted-foreground">40 moving dots, stress test</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
