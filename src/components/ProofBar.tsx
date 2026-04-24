import { Check } from "lucide-react";
import { SITE } from "../data/site";

export default function ProofBar() {
  return (
    <div
      className="border-y"
      style={{
        background: "var(--moss-deeper)",
        borderColor: "rgba(86,201,158,0.12)",
        padding: "20px var(--pad)",
      }}
    >
      <div className="max-w-container mx-auto flex items-center justify-center gap-6 md:gap-10 flex-wrap">
        {SITE.proofBar.map((it, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 text-[13px] text-white/55"
          >
            <Check
              size={14}
              className="text-moss-mid flex-shrink-0"
              strokeWidth={2.2}
            />
            <span>
              <span className="text-white/85 font-medium">{it.highlight}</span>
              {it.after}
            </span>
            {i < SITE.proofBar.length - 1 && (
              <span className="hidden md:inline-block w-px h-4 bg-white/10 ml-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
