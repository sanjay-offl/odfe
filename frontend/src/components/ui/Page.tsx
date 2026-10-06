import { motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';
import type { Variants } from 'framer-motion';

const variants: Variants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }
  }
};

export function Page({ children }: PropsWithChildren) {
  return (
    <motion.div variants={variants} initial="initial" animate="animate" exit="exit" style={{ willChange: 'transform, opacity' }}>
      {children}
    </motion.div>
  );
}
