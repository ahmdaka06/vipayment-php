import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import OrderSummary from "@/components/OrderSummary";
import PaymentPanel from "@/components/PaymentPanel";
import { fetcher, type OrderView } from "@/lib/api";

export default function CheckoutPage() {
  const params = useParams<{ invoice: string }>();
  const invoice = typeof params?.invoice === "string" ? params.invoice : "";

  const { data: order, error, isLoading, mutate } = useSWR<OrderView>(
    invoice ? `/orders/${invoice}` : null,
    fetcher,
    { refreshInterval: 4000 },
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-white/[0.04]" />
        <div className="h-72 animate-pulse rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-6 text-sm text-rose-200">
        Invoice tidak ditemukan.{" "}
        <Link to="/" className="underline">
          Kembali ke katalog
        </Link>
        .
      </div>
    );
  }

  const settled = order.status !== "pending_payment";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">
            {settled ? "Detail pesanan" : "Selesaikan pembayaran"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {settled
              ? "Pembayaran sudah diterima. Pesanan diproses otomatis."
              : "Bayar sesuai nominal, lalu unggah bukti pembayaran."}
          </p>
        </div>
        <Link
          to={`/invoice/${order.invoice}`}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5"
        >
          Lihat status pesanan
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <OrderSummary order={order} />
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-slate-400">
            Simpan invoice{" "}
            <span className="font-mono text-slate-200">{order.invoice}</span>.
            Kamu bisa melacak pesanan kapan saja lewat menu{" "}
            <Link to="/lacak" className="text-cyan-300 underline">
              Lacak Invoice
            </Link>
            .
          </div>
        </div>

        <PaymentPanel order={order} onChanged={() => void mutate()} />
      </div>
    </div>
  );
}
