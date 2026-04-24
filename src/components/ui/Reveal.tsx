import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
};

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: custom, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Reveal({ children, delay = 0, className, y }: Props) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      custom={delay}
      style={y !== undefined ? { y } : undefined}
    >
      {children}
    </motion.div>
  );
}
