import { motion } from "framer-motion";

import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
}

export default function FadeIn({ children }: FadeInProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}

      animate={{
        opacity: 1,
      }}

      transition={{
        duration: 0.4,
      }}
    >
      {children}
    </motion.div>
  );
}
