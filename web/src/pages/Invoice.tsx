import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import OrderSummary from "@/components/OrderSummary";
import PaymentPanel from "@/components/PaymentPanel";
import StatusTimeline from "@/components/StatusTimeline";
import { fetcher, formatDate, type OrderView } from "@/lib/api";

export default function InvoicePage() {
  const params = useParams<{ invoice: string }>();
  const invoice = typeof params?.invoice === "string" ? params.invoice : "";

  const { data: order, error, isLoading, mutate } = useSWR<OrderView>(
    invoice ? `/orders/${invoice}` : null,
    fetcher,
    { refreshInterval: 4000 },
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
        <div className="h-72 animate-pulse rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-6 text-sm text-rose-200">
        Invoice tidak ditemukan.{" "}
        <Link to="/lacak" className="underline">
          Coba lacak lagi
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Detail pesanan
          </p>
          <h1 className="mt-1 font-mono text-xl font-bold text-white">
            {order.invoice}
          </h1>
        </div>
        {order.status === "pending_payment" && (
          <Link
            to={`/checkout/${order.invoice}`}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-white"
          >
            Bayar sekarang
          </Link>
        )}
      </div>

      {order.status === "success" && order.provider.sn && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
            Serial number
          </p>
          <p className="mt-1 break-all font-mono text-sm text-emerald-100">
            {order.provider.sn}
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <OrderSummary order={order} />

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-semibold text-slate-100">
              Detail provider
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Trx ID</span>
                <span className="font-mono text-slate-100">
                  {order.provider.trxid ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Status provider</span>
                <span className="text-slate-100">
                  {order.provider.status ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Selesai</span>
                <span className="text-slate-100">
                  {formatDate(order.completed_at)}
                </span>
              </div>
              {order.provider.failure_reason && (
                <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {order.provider.failure_reason}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {order.status === "pending_payment" && (
            <PaymentPanel order={order} onChanged={() => void mutate()} />
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-100">
              Riwayat status
            </h2>
            <StatusTimeline status={order.status} events={order.events} />
          </div>
        </div>
      </div>
    </div>
  );
}
