import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

type Props = { message: string; onClose: () => void };

export default function Toast({ message, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="fixed bottom-6 right-6 z-[1100] flex items-center gap-3 rounded-xl border border-[rgba(86,201,158,0.3)] bg-[#0D2318] text-white shadow-2xl shadow-black/30 px-4 py-3 max-w-sm"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-moss/20 text-moss-mid">
        <Check size={14} strokeWidth={2.4} />
      </span>
      <span className="text-sm leading-snug">{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="ml-2 text-white/40 hover:text-white/80 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
