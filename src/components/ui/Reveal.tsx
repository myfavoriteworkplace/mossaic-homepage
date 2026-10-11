import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
};

type RevealMotionOptions = {
  delay: number;
  reducedMotion: boolean;
};

const variants: Variants = {
  hidden: (options: RevealMotionOptions) =>
    options.reducedMotion
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: 24 },
  show: (options: RevealMotionOptions = { delay: 0, reducedMotion: false }) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: options.reducedMotion ? 0 : options.delay,
      duration: options.reducedMotion ? 0 : 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function Reveal({ children, delay = 0, className, y }: Props) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      custom={{ delay, reducedMotion }}
      style={y !== undefined && !reducedMotion ? { y } : undefined}
    >
      {children}
    </motion.div>
  );
}
