import { Check } from "lucide-react";
import AnimatedCounter from "./ui/AnimatedCounter";

const items = [
  { kind: "counter" as const, value: 50, suffix: "+", before: "Trusted by", after: "dental clinics across Kerala" },
  { kind: "text" as const, before: "India-region data hosting · ", highlight: "DISHA compliant" },
  { kind: "text" as const, before: "Founded in Kerala · ", highlight: "Building for India" },
  { kind: "text" as const, before: "", highlight: "Free to get started", after: " · No setup fees" },
];

export default function ProofBar() {
  return (
    <div
      className="border-y border-[rgba(86,201,158,0.12)]"
      style={{ background: "var(--moss-deep)", padding: "20px var(--pad)" }}
    >
      <div className="max-w-container mx-auto flex items-center justify-center gap-6 md:gap-10 flex-wrap">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2.5 text-[13px] text-white/55">
            <Check size={14} className="text-moss-mid flex-shrink-0" strokeWidth={2.2} />
            <span>
              {it.before}
              {it.kind === "counter" ? (
                <>
                  {" "}
                  <span className="text-white/85 font-medium">
                    <AnimatedCounter value={it.value} suffix={it.suffix} />
                  </span>{" "}
                  {it.after}
                </>
              ) : (
                <>
                  <span className="text-white/85 font-medium">{it.highlight}</span>
                  {it.after ?? ""}
                </>
              )}
            </span>
            {i < items.length - 1 && (
              <span className="hidden md:inline-block w-px h-4 bg-white/10 ml-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
