'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export function Card({ children, className, hoverEffect = true, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, scale: 1.01 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        "rounded-2xl border border-white/60 bg-white/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl",
        "transition-all duration-300",
        "hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-white/80",
        "dark:border-white/10 dark:bg-slate-900/50 dark:backdrop-blur-xl dark:hover:border-white/20",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
