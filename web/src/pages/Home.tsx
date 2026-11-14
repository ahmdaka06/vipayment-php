import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import useSWR from "swr";
import GameCard from "@/components/GameCard";
import { fetcher, type Game } from "@/lib/api";

type Filter = "all" | "pulsa" | "pln";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pulsa", label: "Pulsa & Data" },
  { key: "pln", label: "Token PLN" },
];

const PULSA_CATEGORIES = [
  "pulsa-reguler",
  "pulsa-transfer",
  "pulsa-internasional",
  "paket-internet",
  "paket-telepon",
  "paket-lainnya",
];

function matchesFilter(game: Game, filter: Filter): boolean {
  if (filter === "all") return true;
  if (game.kind !== "prepaid") return false;

  const category = game.category ?? "";
  if (filter === "pulsa") return PULSA_CATEGORIES.includes(category);
  return category === "token-pln";
}

export default function HomePage() {
  const { data, error, isLoading } = useSWR<{ games: Game[] }>(
    "/games",
    fetcher,
    { refreshInterval: 60000 },
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const allGames = data?.games ?? [];

  const games = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allGames.filter(
      (game) =>
        matchesFilter(game, filter) &&
        game.name.toLowerCase().includes(needle),
    );
  }, [allGames, filter, query]);

  const hasAvailableProducts = allGames.some(
    (game) => game.product_count > 0,
  );

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/25 via-[#0b1220] to-cyan-500/10 px-6 py-10 sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            Proses otomatis 24 jam
          </span>

          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Top up pulsa, paket data, dan token PLN
            <br />
            <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              langsung diproses otomatis.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Pilih produk, isi nomor HP atau ID pelanggan / nomor meter, bayar,
            lalu unggah bukti. Setelah pembayaran diverifikasi, pesanan otomatis
            dikirim ke provider dan statusnya bisa kamu pantau lewat invoice.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/lacak"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5"
            >
              Lacak invoice
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Pilih produk</h2>
            <p className="text-sm text-slate-400">
              Pulsa, paket data, dan token PLN dengan harga sudah termasuk biaya
              layanan.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {games.length} grup ditampilkan
          </span>
        </div>

        <div className="mb-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari pulsa, paket data, atau token PLN..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
          />
          {query.trim() && (
            <p className="mt-1.5 text-xs text-slate-500">
              {games.length} hasil untuk &ldquo;{query.trim()}&rdquo;
            </p>
          )}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const count = allGames.filter((game) =>
              matchesFilter(game, item.key),
            ).length;
            const active = filter === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                  active
                    ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/25 hover:text-slate-200"
                }`}
              >
                {item.label}
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
                    active
                      ? "bg-cyan-400/20 text-cyan-100"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {!isLoading && !error && allGames.length > 0 && !hasAvailableProducts && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
            Katalog sudah termuat, tetapi belum ada nominal yang tersedia.
            Sinkronisasi mungkin belum selesai, atau provider menolak akses dari
            IP server ini.
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            Gagal memuat katalog. Pastikan API berjalan di{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5">
              VITE_API_URL
            </code>
            .
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center">
            <p className="text-sm text-slate-300">
              {query
                ? "Produk tidak ditemukan."
                : "Belum ada produk pada kategori ini."}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Katalog disinkronkan otomatis dari provider setiap 30 menit.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {games.map((game, index) => (
              <GameCard key={game.slug} game={game} index={index} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "1. Isi data tujuan",
            body: "Masukkan nomor HP untuk pulsa/paket data, atau ID pelanggan / nomor meter untuk token PLN.",
          },
          {
            title: "2. Bayar & unggah bukti",
            body: "Transfer sesuai nominal, lalu unggah bukti pembayaran di halaman checkout.",
          },
          {
            title: "3. Pantau status",
            body: "Pesanan otomatis dikirim ke provider setelah pembayaran diverifikasi.",
          },
        ].map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h3 className="text-sm font-semibold text-slate-100">
              {step.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              {step.body}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
