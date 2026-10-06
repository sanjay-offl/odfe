import { motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      className={`bg-white border border-[#eee3d9] rounded-[14px] shadow-[0_7px_25px_rgba(58,31,10,0.05)] ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 12px 28px rgba(58,31,10,0.12)' }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCardBody({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05, duration: 0.18 }}
    >
      {children}
    </motion.div>
  );
}
