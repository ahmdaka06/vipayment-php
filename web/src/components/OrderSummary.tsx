import { formatDate, type OrderView } from "@/lib/api";
import StatusBadge from "./StatusBadge";

export default function OrderSummary({ order }: { order: OrderView }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Invoice
          </p>
          <p className="mt-1 font-mono text-sm text-slate-100">{order.invoice}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-5 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">Game</span>
          <span className="text-right font-medium text-slate-100">
            {order.game?.name ?? order.product.name}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">Produk</span>
          <span className="text-right font-medium text-slate-100">
            {order.product.name}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">{order.account.user_id_label}</span>
          <span className="text-right font-mono text-slate-100">
            {order.account.user_id}
          </span>
        </div>
        {order.account.zone && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">{order.account.zone_label}</span>
            <span className="text-right font-mono text-slate-100">
              {order.account.zone}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">Kontak</span>
          <span className="text-right text-slate-100">{order.contact}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">Dibuat</span>
          <span className="text-right text-slate-100">
            {formatDate(order.created_at)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
        <span className="text-sm text-slate-400">Total bayar</span>
        <span className="text-2xl font-bold text-cyan-300">
          {order.amount_label}
        </span>
      </div>
    </div>
  );
}
