import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  delay?: number;
}

export function Tooltip({ children, content, delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  let timeout: NodeJS.Timeout;

  const show = () => {
    timeout = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full mb-2 px-2 py-1 bg-slate-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap z-50 pointer-events-none"
          >
            {content}
            {/* Arrow */}
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
