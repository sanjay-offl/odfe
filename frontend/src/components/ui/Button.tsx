import { motion } from 'framer-motion';
import type { ComponentProps, PropsWithChildren } from 'react';

type ButtonProps = ComponentProps<typeof motion.button> & {
  variant?: 'primary' | 'secondary' | 'text';
  full?: boolean;
};

export function Button({
  variant = 'primary',
  full = false,
  children,
  className = '',
  whileHover,
  whileTap,
  ...props
}: PropsWithChildren<ButtonProps>) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md min-h-[46px] px-4 font-semibold transition-[transform,background,box-shadow] will-change-transform select-none';
  const v =
    variant === 'primary'
      ? 'bg-[var(--caramel)] text-white shadow-[0_6px_18px_-10px_rgba(196,127,59,0.45)] hover:bg-[#aa6729]'
      : variant === 'secondary'
        ? 'bg-[#f2e9df] text-[var(--roast)] hover:bg-[#e9ddd1]'
        : 'bg-transparent text-[var(--caramel)] min-h-0 px-0';

  const f = full ? 'w-full' : '';

  const defaultHover = { y: -1, scale: 1.005 };
  const defaultTap = { scale: 0.995, y: 0 };

  return (
    <motion.button
      className={`${base} ${v} ${f} ${className}`.trim()}
      whileHover={whileHover ?? defaultHover}
      whileTap={whileTap ?? defaultTap}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
