import { formatDate, type OrderEvent } from "@/lib/api";

const STEPS = [
  { key: "pending_payment", label: "Pembayaran" },
  { key: "paid", label: "Dikonfirmasi" },
  { key: "processing", label: "Diproses" },
  { key: "success", label: "Selesai" },
];

function stepIndex(status: string): number {
  if (status === "success") return 3;
  if (status === "processing" || status === "submitting") return 2;
  if (status === "paid") return 1;
  if (status === "pending_payment") return 0;
  return -1;
}

export default function StatusTimeline({
  status,
  events,
}: {
  status: string;
  events: OrderEvent[];
}) {
  const current = stepIndex(status);
  const failed = current === -1;

  return (
    <div className="space-y-6">
      {!failed && (
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => {
            const done = index <= current;
            const active = index === current;

            return (
              <div key={step.key} className="flex flex-1 items-center gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ${
                      done
                        ? "bg-cyan-400 text-[#04121a]"
                        : "bg-white/5 text-slate-500 ring-1 ring-white/10"
                    } ${active ? "ring-4 ring-cyan-400/20" : ""}`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <span
                    className={`hidden text-[11px] sm:block ${
                      done ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-px flex-1 ${
                      index < current ? "bg-cyan-400/60" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <ol className="space-y-4">
        {events.map((event, index) => (
          <li key={`${event.at}-${index}`} className="flex gap-3">
            <div className="relative flex flex-col items-center">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
              {index < events.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-white/10" />
              )}
            </div>
            <div className="pb-1">
              <p className="text-sm text-slate-200">
                {event.note ?? event.to}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {formatDate(event.at)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
