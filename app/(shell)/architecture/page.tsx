"use client";

import {
  Activity,
  Database,
  FileText,
  GitMerge,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { PipelineDiagram, type Stage } from "@/components/architecture/pipeline-stage";

const STAGES: Stage[] = [
  {
    title: "Raw transactions",
    tag: "Data",
    icon: Database,
    description:
      "Hourly aggregates per segment — country × MCC × channel × auth type — with approval rate, decline codes, fraud rate, and volume. No row-level transactions ever leave this stage.",
  },
  {
    title: "Detection engine",
    tag: "Code",
    icon: Activity,
    description:
      "Same-hour-of-week baseline (median + MAD) → modified z-score per metric. Three false-positive gates before anything is flagged: a minimum volume floor, a minimum magnitude, and persistence — at least 2 consecutive hours, or one extreme single-hour event.",
  },
  {
    title: "Incident grouping",
    tag: "Code",
    icon: GitMerge,
    description:
      "Hundreds of segment-level alerts are grouped by candidate cause into a handful of analyst-facing incidents — the noise reduction that makes the Overview screen readable.",
  },
  {
    title: "Evidence pack",
    tag: "Code",
    icon: FileText,
    description:
      "Primary metric summary, before/during/after comparison, decline-code breakdown by family, and a control-group comparison — numeric facts only. This is the only thing Jerry ever reads.",
  },
  {
    title: "Jerry",
    tag: "LLM",
    icon: Sparkles,
    description:
      "Gemini reads the evidence pack above — nothing else. It never sees raw transactions and never performs detection. It only writes the plain-language diagnosis: executive summary, key evidence, and recommended actions.",
    highlight: true,
  },
  {
    title: "Grounding verifier",
    tag: "Code",
    icon: ShieldCheck,
    description:
      "Every number in Jerry's answer is checked back against the evidence pack. Unsupported or ambiguous figures are flagged for analyst confirmation, visibly — never hidden, never silently corrected.",
  },
  {
    title: "UI",
    tag: "Output",
    icon: LayoutDashboard,
    description:
      "Overview, Diagnosis, Evidence, and Ask Jerry render exactly what code computed and Jerry explained. The frontend never computes a metric and never invents a number.",
  },
];

const reveal: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function ArchitecturePage() {
  const reduceMotion = useReducedMotion();
  const transition = (delay: number) =>
    reduceMotion ? { duration: 0 } : { duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14">
      <motion.div
        className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center"
        initial="hidden"
        animate="visible"
        variants={reveal}
        transition={transition(0)}
      >
        {/* One deliberate second use of the display serif outside Landing —
            this page is the one place a technical evaluator should feel the
            product make its case, not just another dashboard screen. */}
        <h1 className="font-heading text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
          How Riskline works
        </h1>
        <p className="text-base leading-relaxed text-muted">
          Code detects every anomaly and builds the evidence behind it. Jerry only explains that
          evidence in plain language — it never sees a raw transaction and never decides what
          counts as anomalous. A second piece of code checks Jerry&apos;s explanation afterward.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={reveal}
        transition={transition(0.08)}
      >
        <PipelineDiagram stages={STAGES} />
      </motion.div>
    </div>
  );
}
