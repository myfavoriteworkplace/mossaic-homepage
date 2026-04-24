import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import { useRef, type MouseEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  max?: number;
  scale?: number;
  glare?: boolean;
  style?: MotionStyle;
};

export default function TiltCard({
  children,
  className,
  max = 8,
  scale = 1.012,
  glare = true,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 200, damping: 18 });
  const sy = useSpring(my, { stiffness: 200, damping: 18 });
  const rotX = useTransform(sy, [0, 1], [max, -max]);
  const rotY = useTransform(sx, [0, 1], [-max, max]);
  const glareX = useTransform(sx, (v) => `${v * 100}%`);
  const glareY = useTransform(sy, (v) => `${v * 100}%`);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        rotateX: rotX,
        rotateY: rotY,
        scale: 1,
        ...style,
      }}
      whileHover={{ scale }}
      transition={{ scale: { type: "spring", stiffness: 220, damping: 18 } }}
    >
      <div style={{ transform: "translateZ(0)", position: "relative", height: "100%" }}>
        {children}
        {glare && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: useTransform(
                [glareX, glareY] as never,
                ([gx, gy]) =>
                  `radial-gradient(420px circle at ${gx} ${gy}, rgba(86,201,158,0.18), transparent 55%)`,
              ),
              mixBlendMode: "screen",
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
