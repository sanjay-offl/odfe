import { motion, type Variants } from 'framer-motion';
import type { PropsWithChildren, ReactNode } from 'react';

const container: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }
  }
};

export function StaggerContainer({ children }: PropsWithChildren) {
  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={item} className={className} style={{ willChange: 'transform, opacity' }}>
      {children}
    </motion.div>
  );
}
