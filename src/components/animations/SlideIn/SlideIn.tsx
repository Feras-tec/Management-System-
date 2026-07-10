import { motion } from "framer-motion";

import type { ReactNode } from "react";

interface SlideInProps {
  children: ReactNode;
}

export default function SlideIn({ children }: SlideInProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      transition={{
        duration: 0.4,
      }}
    >
      {children}
    </motion.div>
  );
}
