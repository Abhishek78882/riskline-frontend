"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// Short, accurate-to-the-algorithm lines per active step — this doubles as
// a calm showcase of how detection.py actually works, not marketing copy.
// Indexed the same as PIPELINE_STEPS in pipeline-progress.tsx.
const STEP_DETAILS: string[][] = [
  ["Parsing CSV and validating column schema…"],
  [
    "Computing same-hour-of-week baselines…",
    "Applying the MAD modified z-score…",
    "Applying false-positive gates: volume floor, magnitude, persistence…",
  ],
  ["Grouping segment alerts into incidents…", "Matching against known cause patterns…"],
  ["Building evidence packs…", "Computing before/during/after comparisons…"],
  ["Finalizing incident summaries…"],
];

const CYCLE_MS = 3500;

// Rendered with key={currentStep} by the caller so a step change remounts
// this fresh (index resets to 0 for free) instead of resetting state
// inside an effect.
export function PipelineDetail({ currentStep }: { currentStep: number }) {
  const reduceMotion = useReducedMotion();
  const lines = STEP_DETAILS[Math.min(currentStep, STEP_DETAILS.length - 1)] ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (lines.length <= 1) return;
    const interval = setInterval(() => setIndex((i) => (i + 1) % lines.length), CYCLE_MS);
    return () => clearInterval(interval);
  }, [lines.length]);

  if (lines.length === 0) return null;

  return (
    <div className="h-4 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={`${currentStep}-${index}`}
          initial={reduceMotion ? undefined : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="text-xs text-muted"
        >
          {lines[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
