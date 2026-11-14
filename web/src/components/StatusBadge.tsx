import { orderStatusInfo, paymentStatusInfo } from "@/lib/api";

const TONES: Record<string, string> = {
  amber: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  green: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  blue: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
  red: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
  purple: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
  slate: "bg-slate-500/10 text-slate-300 ring-slate-500/30",
};

export default function StatusBadge({
  status,
  kind = "order",
}: {
  status: string;
  kind?: "order" | "payment";
}) {
  const info =
    kind === "payment" ? paymentStatusInfo(status) : orderStatusInfo(status);
  const tone = TONES[info.tone] ?? TONES.slate;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {info.label}
    </span>
  );
}
