import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import {
  apiFetch,
  errorMessage,
  formatDate,
  type LookupOrder,
} from "@/lib/api";

export default function TrackPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LookupOrder[] | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();

    if (!value) {
      setError("Masukkan nomor invoice atau kontak.");
      return;
    }

    if (/^inv-/i.test(value)) {
      navigate(`/invoice/${encodeURIComponent(value.toUpperCase())}`);
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await apiFetch<{ orders: LookupOrder[] }>(
        `/orders/lookup?contact=${encodeURIComponent(value)}`,
      );
      setResults(data.orders);
    } catch (lookupError) {
      setError(errorMessage(lookupError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-xl font-bold text-white">Lacak pesanan</h1>
        <p className="mt-1 text-sm text-slate-400">
          Masukkan nomor invoice, atau nomor WhatsApp / email yang kamu pakai
          saat checkout.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setError(null);
            }}
            placeholder="INV-260101-XXXXXXXX / 08xxxxxxxxxx / email"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
          />

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Mencari..." : "Lacak pesanan"}
          </button>
        </form>

        {results && (
          <div className="mt-5 space-y-3">
            {results.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                Tidak ada pesanan untuk kontak tersebut.
              </p>
            ) : (
              results.map((order) => (
                <Link
                  key={order.invoice}
                  to={`/invoice/${order.invoice}`}
                  className="block rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-slate-300">
                      {order.invoice}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-100">
                    {order.product_name}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                    <span>{order.amount_label}</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
