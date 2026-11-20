import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
export function Reveal({
  children,
  className = "",
  delay = 0,
  visibleOnMount = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  visibleOnMount?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: visibleOnMount ? 1 : 0, y: 18 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, delay }}
    >
      {children}
    </motion.div>
  );
}
