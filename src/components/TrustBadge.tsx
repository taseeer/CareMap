import { cn } from "@/lib/utils";
import type { TrustLabel } from "@/lib/types";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

export function TrustBadge({ label, score, className }: { label: TrustLabel; score: number; className?: string }) {
  const styles: Record<TrustLabel, { cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
    Verified: {
      cls: "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]",
      Icon: CheckCircle2,
    },
    "Needs Review": {
      cls: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
      Icon: AlertTriangle,
    },
    Suspicious: {
      cls: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
      Icon: ShieldAlert,
    },
  };
  const s = styles[label];
  const Icon = s.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-[0_1px_0_rgba(2,6,23,0.04)]",
        s.cls,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label} · {score}
    </span>
  );
}
