import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { ReactNode } from "react";

import PublicFooter from "../../organisms/PublicFooter/PublicFooter";
import PublicNavbar from "../../organisms/PublicNavbar/PublicNavbar";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  const reduced = useReducedMotion();

  return (
    <div className="public-brand min-h-screen bg-base-100">
      <PublicNavbar />

      <AnimatePresence mode="wait" initial={location.pathname !== "/"}>
        <motion.main
          key={location.pathname}
          initial={reduced ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -15 }}
          transition={{ duration: reduced ? 0 : 0.25 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <PublicFooter />
    </div>
  );
}
