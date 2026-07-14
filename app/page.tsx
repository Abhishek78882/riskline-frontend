"use client";

import Link from "next/link";
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

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const transition = (delay: number) =>
    reduceMotion ? { duration: 0 } : { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <main className="hero-atmosphere flex min-h-screen flex-col justify-center px-8 py-24 sm:px-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16">
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
            className="group flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/10 px-6 py-5 transition-colors hover:bg-accent/15"
          >
            <span className="flex items-center justify-between text-sm font-medium text-ink">
              Start with built-in demo
              <ArrowRight className="size-4 text-accent transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="text-xs text-muted">
              5 pre-computed incidents, instant load, no setup.
            </span>
          </Link>

          <Link
            href="/upload"
            className="group flex flex-col gap-2 rounded-lg border border-border bg-surface px-6 py-5 transition-colors hover:border-accent/30"
          >
            <span className="flex items-center justify-between text-sm font-medium text-ink">
              Upload demo dataset
              <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
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
