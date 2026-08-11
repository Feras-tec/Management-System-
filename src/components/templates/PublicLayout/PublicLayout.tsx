import { AnimatePresence, motion } from "framer-motion";

import type { ReactNode } from "react";

import PublicFooter from "../../organisms/PublicFooter/PublicFooter";
import PublicNavbar from "../../organisms/PublicNavbar/PublicNavbar";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-base-100">
      <PublicNavbar />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <PublicFooter />
    </div>
  );
}
