import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, animate, useTransform } from "framer-motion";

type Props = {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

export default function AnimatedCounter({
  value,
  duration = 1.6,
  prefix = "",
  suffix = "",
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.floor(v).toLocaleString());
  const [text, setText] = useState("0");

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setText(v));
    return () => unsub();
  }, [rounded]);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return controls.stop;
  }, [inView, value, duration, mv]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
