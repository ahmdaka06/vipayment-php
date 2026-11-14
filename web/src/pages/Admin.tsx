import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import StatusBadge from "@/components/StatusBadge";
import {
  apiFetch,
  errorMessage,
  fileUrl,
  formatDate,
  type AdminOrder,
  type AdminPayment,
  type AdminProfile,
  type SyncReport,
} from "@/lib/api";

const TOKEN_KEY = "vipayment_admin_token";
const CARD = "rounded-2xl border border-white/10 bg-white/[0.03] p-5";

type Tab = "payments" | "orders" | "catalog";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [tab, setTab] = useState<Tab>("payments");
  const [paymentFilter, setPaymentFilter] = useState("awaiting_review");
  const [orderFilter, setOrderFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  const adminFetch = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (path: string): Promise<any> =>
      apiFetch(path, { token: token ?? undefined }),
    [token],
  );

  const { data: profile } = useSWR<AdminProfile>(
    token ? "/admin/profile" : null,
    adminFetch,
    { refreshInterval: 60000 },
  );

  const { data: paymentsData, mutate: mutatePayments } = useSWR<{
    payments: AdminPayment[];
  }>(
    token && tab === "payments"
      ? `/admin/payments?status=${paymentFilter}&q=${encodeURIComponent(
          debouncedSearch,
        )}`
      : null,
    adminFetch,
    { refreshInterval: 5000 },
  );

  const { data: ordersData, mutate: mutateOrders } = useSWR<{
    orders: AdminOrder[];
  }>(
    token && tab === "orders"
      ? `/admin/orders?status=${orderFilter}&q=${encodeURIComponent(
          debouncedSearch,
        )}`
      : null,
    adminFetch,
    { refreshInterval: 5000 },
  );

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    try {
      await apiFetch("/admin/profile", { token: tokenInput.trim() });
      window.sessionStorage.setItem(TOKEN_KEY, tokenInput.trim());
      setToken(tokenInput.trim());
      setTokenInput("");
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  function logout() {
    window.sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  async function act(path: string, body?: unknown) {
    if (!token) return;
    setBusy(path);
    setMessage(null);

    try {
      await apiFetch(path, {
        method: "POST",
        token,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      await Promise.all([mutatePayments(), mutateOrders()]);
      setMessage("Berhasil.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  function rejectPayment(invoice: string) {
    const reason = window.prompt("Alasan penolakan bukti bayar:");
    if (!reason) return;
    void act(`/admin/payments/${encodeURIComponent(invoice)}/reject`, {
      reason,
    });
  }

  async function syncProducts() {
    if (!token) return;
    setBusy("sync");
    setMessage(null);

    try {
      const report = await apiFetch<SyncReport>("/admin/sync-products", {
        method: "POST",
        token,
      });
      setSyncReport(report);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md">
        <form onSubmit={login} className={`${CARD} space-y-4`}>
          <div>
            <h1 className="text-xl font-bold text-white">Admin panel</h1>
            <p className="mt-1 text-sm text-slate-400">
              Masukkan <code className="text-slate-200">ADMIN_TOKEN</code> yang
              ada di konfigurasi API.
            </p>
          </div>

          <input
            type="password"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="Admin token"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
          />

          {message && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Masuk
          </button>
        </form>
      </div>
    );
  }

  const balance = profile?.profile?.balance;
  const balanceLabel =
    typeof balance === "number"
      ? `Rp ${balance.toLocaleString("id-ID")}`
      : balance
        ? String(balance)
        : "-";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Admin panel</h1>
          <p className="mt-1 text-sm text-slate-400">
            Verifikasi pembayaran, pantau order, dan sinkronkan katalog.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5"
        >
          Keluar
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["payments", "Pembayaran"],
            ["orders", "Order"],
            ["catalog", "Katalog & saldo"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              tab === value
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== "catalog" && (
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari invoice, produk, User ID, kontak, atau Trx ID..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
        />
      )}

      {tab === "payments" && (
        <div className={CARD}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Pembayaran
            </h2>
            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className="rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
            >
              <option value="awaiting_review">Menunggu review</option>
              <option value="pending">Belum bayar</option>
              <option value="paid">Lunas</option>
              <option value="rejected">Ditolak</option>
              <option value="all">Semua</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-3">Invoice</th>
                  <th className="py-2 pr-3">Produk</th>
                  <th className="py-2 pr-3">Akun</th>
                  <th className="py-2 pr-3">Kontak</th>
                  <th className="py-2 pr-3">Nominal</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Bukti</th>
                  <th className="py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(paymentsData?.payments ?? []).map((payment) => {
                  const proof = fileUrl(payment.proof_url);
                  const canReview = payment.payment_status === "awaiting_review";

                  return (
                    <tr
                      key={payment.invoice}
                      className="border-b border-white/5 align-top"
                    >
                      <td className="py-3 pr-3">
                        <span className="font-mono text-xs text-slate-200">
                          {payment.invoice}
                        </span>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatDate(payment.created_at)}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="text-slate-200">{payment.product_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {payment.game_slug}
                        </p>
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs text-slate-300">
                        {payment.user_id}
                        {payment.zone ? ` (${payment.zone})` : ""}
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-300">
                        {payment.contact}
                      </td>
                      <td className="py-3 pr-3 text-slate-200">
                        {payment.amount_label}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge
                          status={payment.payment_status}
                          kind="payment"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        {proof ? (
                          <a
                            href={proof}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-cyan-300 underline underline-offset-2"
                          >
                            Lihat
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() =>
                              void act(
                                `/admin/payments/${encodeURIComponent(payment.invoice)}/approve`,
                              )
                            }
                            className="rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-medium text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-40"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busy !== null || !canReview}
                            onClick={() => rejectPayment(payment.invoice)}
                            className="rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-[11px] font-medium text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(paymentsData?.payments ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              Tidak ada pembayaran pada filter ini.
            </p>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className={CARD}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-100">Order</h2>
            <select
              value={orderFilter}
              onChange={(event) => setOrderFilter(event.target.value)}
              className="rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">Semua</option>
              <option value="pending_payment">Menunggu pembayaran</option>
              <option value="paid">Dibayar</option>
              <option value="processing">Diproses</option>
              <option value="success">Berhasil</option>
              <option value="needs_attention">Perlu tindakan</option>
              <option value="refund_pending">Menunggu refund</option>
              <option value="failed">Gagal</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-3">Invoice</th>
                  <th className="py-2 pr-3">Produk</th>
                  <th className="py-2 pr-3">Akun</th>
                  <th className="py-2 pr-3">Nominal</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Trx / SN</th>
                  <th className="py-2 pr-3">Update</th>
                  <th className="py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(ordersData?.orders ?? []).map((order) => {
                  const canRetry = [
                    "needs_attention",
                    "failed",
                    "refund_pending",
                  ].includes(order.status);

                  return (
                    <tr
                      key={order.invoice}
                      className="border-b border-white/5 align-top"
                    >
                      <td className="py-3 pr-3 font-mono text-xs text-slate-200">
                        {order.invoice}
                      </td>
                      <td className="py-3 pr-3">
                        <p className="text-slate-200">{order.product_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {order.game_slug}
                        </p>
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs text-slate-300">
                        {order.user_id}
                        {order.zone ? ` (${order.zone})` : ""}
                      </td>
                      <td className="py-3 pr-3 text-slate-200">
                        Rp {order.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge status={order.status} />
                        {order.failure_reason && (
                          <p className="mt-1 max-w-[220px] text-[11px] text-rose-300">
                            {order.failure_reason}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-3 font-mono text-[11px] text-slate-300">
                        <p>{order.provider_trxid ?? "-"}</p>
                        <p className="text-slate-500">
                          {order.provider_sn ?? "-"}
                        </p>
                      </td>
                      <td className="py-3 pr-3 text-[11px] text-slate-400">
                        {formatDate(order.updated_at)}
                        {order.submit_attempts > 0 && (
                          <p className="text-slate-500">
                            {order.submit_attempts}x percobaan
                          </p>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-2">
                          {canRetry && (
                            <button
                              type="button"
                              disabled={busy !== null}
                              onClick={() =>
                                void act(
                                  `/admin/orders/${encodeURIComponent(order.invoice)}/retry`,
                                )
                              }
                              className="rounded-lg bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-medium text-sky-200 transition hover:bg-sky-500/25 disabled:opacity-40"
                            >
                              Kirim ulang
                            </button>
                          )}
                          {order.status === "refund_pending" && (
                            <button
                              type="button"
                              disabled={busy !== null}
                              onClick={() =>
                                void act(
                                  `/admin/orders/${encodeURIComponent(order.invoice)}/refunded`,
                                )
                              }
                              className="rounded-lg bg-slate-500/15 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-slate-500/25 disabled:opacity-40"
                            >
                              Refund selesai
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(ordersData?.orders ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              Tidak ada order pada filter ini.
            </p>
          )}
        </div>
      )}

      {tab === "catalog" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={CARD}>
            <h2 className="text-sm font-semibold text-slate-100">
              Saldo provider
            </h2>
            <p className="mt-3 text-2xl font-bold text-cyan-300">
              {balanceLabel}
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              <p>Username: {profile?.profile?.username ?? "-"}</p>
              <p>Level: {profile?.profile?.level ?? "-"}</p>
              <p>
                Signature:{" "}
                {profile?.signature_ok === false ? (
                  <span className="text-rose-300">
                    tidak cocok dengan SIGN di env
                  </span>
                ) : (
                  <span className="text-emerald-300">valid</span>
                )}
              </p>
            </div>
          </div>

          <div className={CARD}>
            <h2 className="text-sm font-semibold text-slate-100">
              Sinkronisasi katalog
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Mengambil ulang daftar game dan nominal dari provider, lalu
              menerapkan markup harga. Sinkronisasi otomatis juga berjalan
              setiap 30 menit.
            </p>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void syncProducts()}
              className="mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy === "sync" ? "Menyinkronkan..." : "Sync sekarang"}
            </button>

            {syncReport && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                <p>
                  {syncReport.groups} grup, {syncReport.products} produk,{" "}
                  {syncReport.logos} logo tersimpan.
                </p>
                {syncReport.errors.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-300">
                    {syncReport.errors.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className={`${CARD} lg:col-span-2`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Margin harga
              </h2>
              <span className="text-xs text-slate-500">
                default {profile?.markup_percent ?? 5}%
              </span>
            </div>

            {Object.keys(profile?.markup_by_category ?? {}).length === 0 &&
            Object.keys(profile?.markup_fixed_by_category ?? {}).length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                Belum ada override per kategori; semua memakai margin default.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                {Object.keys(profile?.markup_by_category ?? {}).length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Margin persen
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(profile?.markup_by_category ?? {})
                        .sort(([left], [right]) => left.localeCompare(right))
                        .map(([category, percent]) => (
                          <div
                            key={category}
                            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs"
                          >
                            <span className="text-slate-300">{category}</span>
                            <span className="font-medium text-cyan-300">
                              {percent}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {Object.keys(profile?.markup_fixed_by_category ?? {}).length >
                  0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Margin nominal (Rp)
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(profile?.markup_fixed_by_category ?? {})
                        .sort(([left], [right]) => left.localeCompare(right))
                        .map(([category, amount]) => (
                          <div
                            key={category}
                            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs"
                          >
                            <span className="text-slate-300">{category}</span>
                            <span className="font-medium text-emerald-300">
                              Rp {amount.toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Ubah <code>MARKUP_BY_CATEGORY</code> (persen) atau{" "}
              <code>MARKUP_FIXED_BY_CATEGORY</code> (nominal rupiah, menang atas
              persen) di <code>apps/catalog-service/.env</code>, restart API, lalu tekan Sync
              sekarang. Kategori: game, app, pulsa-reguler, pulsa-transfer,
              pulsa-internasional, paket-internet, paket-telepon, paket-lainnya,
              saldo-emoney, token-pln, streaming-tv, voucher-game.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
