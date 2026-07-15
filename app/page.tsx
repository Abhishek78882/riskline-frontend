"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const PIPELINE_STEPS = [
  "Load Data",
  "Detect Anomalies",
  "Group Incidents",
  "Build Evidence",
  "Ask Jerry",
];

const reveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// DESIGN.md §4: transform/opacity only, respects prefers-reduced-motion.
// A gentle damped follow — the glow eases toward the cursor over ~1s, never
// snaps to it. Disabled on touch/reduced-motion, falling back to the CSS
// `hero-drift` keyframe already on `.hero-glow`.
// Kept small (was 70px): the black-strip bug was this offset pulling the
// glow's light away from an edge as it eased toward the opposite one. A
// bigger/softer blob (see .hero-glow in globals.css) plus a static
// .hero-ambient base layer are the primary fix; a smaller max travel is
// the belt-and-suspenders second half of it.
const GLOW_MAX_OFFSET_PX = 36;
const GLOW_EASE = 0.035;

function subscribePointerFine(callback: () => void) {
  const mql = window.matchMedia("(pointer: fine)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function getPointerFineSnapshot() {
  return window.matchMedia("(pointer: fine)").matches;
}
function getPointerFineServerSnapshot() {
  return false;
}

function useCursorGlow(ref: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * GLOW_MAX_OFFSET_PX;
      target.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2 * GLOW_MAX_OFFSET_PX;
    };

    const tick = () => {
      current.x += (target.x - current.x) * GLOW_EASE;
      current.y += (target.y - current.y) * GLOW_EASE;
      el.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [ref, enabled]);
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const transition = (delay: number) =>
    reduceMotion ? { duration: 0 } : { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const };

  const glowRef = useRef<HTMLDivElement>(null);
  const pointerFine = useSyncExternalStore(
    subscribePointerFine,
    getPointerFineSnapshot,
    getPointerFineServerSnapshot,
  );
  const cursorFollowEnabled = pointerFine && !reduceMotion;
  useCursorGlow(glowRef, cursorFollowEnabled);

  return (
    <main className="hero-atmosphere flex min-h-screen flex-col justify-center overflow-hidden px-8 py-24 sm:px-16">
      <div className="hero-ambient" aria-hidden="true" />
      <div
        ref={glowRef}
        className={`hero-glow${cursorFollowEnabled ? " hero-glow--interactive" : ""}`}
        aria-hidden="true"
      />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-16">
        <motion.div
          className="flex flex-col gap-8"
          initial="hidden"
          animate="visible"
          variants={reveal}
          transition={transition(0)}
        >
          {/* DESIGN.md §2: DM Serif Display, hero use — the one place this
              build spends real typographic boldness. */}
          <h1 className="font-heading text-[clamp(3.5rem,9vw,8rem)] leading-[0.95] tracking-tight text-ink">
            Riskline
          </h1>
          <div className="flex max-w-xl flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-wider text-muted">
              Issuer-side risk operations
            </p>
            <p className="text-lg leading-relaxed text-ink">
              Code detects anomalies. Jerry explains evidence.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="grid max-w-2xl gap-4 sm:grid-cols-2"
          initial="hidden"
          animate="visible"
          variants={reveal}
          transition={transition(0.08)}
        >
          <Link
            href="/overview"
            className="group entry-card entry-card--primary flex flex-col gap-2 rounded-lg px-6 py-5"
          >
            <span className="flex items-center justify-between text-sm font-medium text-ink">
              Start with built-in demo
              <ArrowRight className="size-4 text-accent transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
            <span className="text-xs text-muted">
              5 pre-computed incidents, instant load, no setup.
            </span>
          </Link>

          <Link
            href="/upload"
            className="group entry-card flex flex-col gap-2 rounded-lg px-6 py-5"
          >
            <span className="flex items-center justify-between text-sm font-medium text-ink">
              Upload demo dataset
              <ArrowRight className="size-4 text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
            </span>
            <span className="text-xs text-muted">
              Run detection live against a sample CSV.
            </span>
          </Link>
        </motion.div>

        <motion.div
          className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted"
          initial="hidden"
          animate="visible"
          variants={reveal}
          transition={transition(0.16)}
        >
          {PIPELINE_STEPS.map((step, i) => (
            <span key={step} className="flex items-center gap-3">
              <span>{step}</span>
              {i < PIPELINE_STEPS.length - 1 && <span className="text-border">&rarr;</span>}
            </span>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
