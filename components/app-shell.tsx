"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { TopNav } from "@/components/top-nav";
import { SelectedIncidentProvider } from "@/lib/selected-incident-context";
import { ChatProvider } from "@/lib/chat-context";

// DESIGN.md §4: one orchestrated staggered reveal on load, transform +
// opacity only, under ~300ms, custom ease-out. Reduced-motion users get the
// end state immediately with no transform/opacity animation at all.
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  // Architecture is a showcase page with no dense data to protect, so it
  // gets the stronger "medium" atmosphere; every other shell route (data
  // screens) gets the barely-perceptible "faint" one. See DESIGN.md §1 and
  // the .app-atmosphere rules in globals.css.
  const atmosphereIntensity = pathname?.startsWith("/architecture") ? "medium" : "faint";
  const transition = (delay: number) =>
    reduceMotion
      ? { duration: 0 }
      : { duration: 0.28, delay, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <SelectedIncidentProvider>
      <ChatProvider>
        <div className="relative isolate flex min-h-screen flex-col">
          <div
            className={`app-atmosphere app-atmosphere--${atmosphereIntensity}`}
            aria-hidden="true"
          />

          <motion.div
            className="relative z-10"
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            transition={transition(0)}
          >
            <TopNav />
          </motion.div>

          {/* No right-hand rail anymore — every route (Overview, Incident
              Detail, Upload, Architecture) ended up hiding it one at a time,
              so it's removed outright rather than left as a per-route
              exclusion list. Its "selected incident" reset control lives in
              the incident header (incident/[id]/layout.tsx) and, for
              reachability from anywhere else, in TopNav. */}
          <motion.main
            className="relative z-10 flex-1 px-8 py-8"
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            transition={transition(0.06)}
          >
            {children}
          </motion.main>
        </div>
      </ChatProvider>
    </SelectedIncidentProvider>
  );
}
