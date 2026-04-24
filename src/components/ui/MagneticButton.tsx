import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type MouseEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: "a" | "button";
  href?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

export default function MagneticButton({
  children,
  className,
  strength = 18,
  as = "button",
  href,
  target,
  rel,
  type = "button",
  disabled,
  onClick,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.6 });

  const handle = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set(((e.clientX - cx) / r.width) * strength);
    y.set(((e.clientY - cy) / r.height) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  if (as === "a") {
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        className={className}
        style={{ x: sx, y: sy }}
        onMouseMove={handle}
        onMouseLeave={reset}
        onClick={onClick}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      className={className}
      style={{ x: sx, y: sy }}
      onMouseMove={handle}
      onMouseLeave={reset}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
