'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export function Card({ children, className, hoverEffect = true, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur',
        hoverEffect && 'transition-all duration-300 hover:border-zinc-700',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
