import { motion, AnimatePresence } from "framer-motion";

import type { MainLayoutProps } from "./MainLayout.types";

import Navbar from "../../organisms/Navbar";
import Sidebar from "../../organisms/Sidebar";
import BackendIdentityProbe from "../../../auth/BackendIdentityProbe";

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300">
      <BackendIdentityProbe />

      <Navbar />

      <div className="flex">
        <Sidebar />

        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            className="min-w-0 flex-1 p-3 pt-14 sm:p-5 sm:pt-20 lg:ml-0 lg:p-6 lg:pt-6"
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -20,
            }}
            transition={{
              duration: 0.3,
            }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
