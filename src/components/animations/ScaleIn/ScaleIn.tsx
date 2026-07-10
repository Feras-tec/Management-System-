import { motion } from "framer-motion";

import type { ReactNode } from "react";

interface ScaleInProps {
  children: ReactNode;
}

export default function ScaleIn({ children }: ScaleInProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.9,
      }}

      animate={{
        opacity: 1,
        scale: 1,
      }}

      transition={{
        duration: 0.3,
      }}
    >
      {children}
    </motion.div>
  );
}
