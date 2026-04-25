import { cn } from "@/lib/utils";
import type { TrustLabel } from "@/lib/types";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

export function TrustBadge({ label, score, className }: { label: TrustLabel; score: number; className?: string }) {
  const styles: Record<TrustLabel, { bg: string; text: string; Icon: React.ComponentType<{ className?: string }> }> = {
    Verified: { bg: "bg-success/15 text-success border-success/30", text: "text-success", Icon: CheckCircle2 },
    "Needs Review": { bg: "bg-warning/15 text-warning border-warning/30", text: "text-warning", Icon: AlertTriangle },
    Suspicious: { bg: "bg-danger/15 text-danger border-danger/40", text: "text-danger", Icon: ShieldAlert },
  };
  const s = styles[label];
  const Icon = s.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        s.bg,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label} · {score}
    </span>
  );
}
