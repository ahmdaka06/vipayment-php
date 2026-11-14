import { Link, useNavigate, useParams } from "react-router-dom";
import { useRef, useState } from "react";
import useSWR from "swr";
import {
  apiFetch,
  errorMessage,
  fetcher,
  fileUrl,
  type GameInfo,
  type OrderView,
  type Product,
} from "@/lib/api";

export default function GamePage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const navigate = useNavigate();

  const { data, error, isLoading } = useSWR<{
    game: GameInfo;
    products: Product[];
  }>(slug ? `/games/${slug}/products` : null, fetcher);

  const [selected, setSelected] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [zone, setZone] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const game = data?.game;
  const products = data?.products ?? [];
  const product = products.find((item) => item.code === selected);
  const [productQuery, setProductQuery] = useState("");
  const visibleProducts = productQuery.trim()
    ? products.filter((item) =>
        `${item.name} ${item.code}`
          .toLowerCase()
          .includes(productQuery.trim().toLowerCase()),
      )
    : products;

  const canSubmit =
    Boolean(game && product) &&
    userId.trim().length > 0 &&
    contact.trim().length > 0 &&
    (!game?.requires_zone || zone.trim().length > 0) &&
    !submitting;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!game || !product || !canSubmit) return;

    setSubmitting(true);
    setFormError(null);

    if (!idempotencyKey.current) {
      idempotencyKey.current = crypto.randomUUID();
    }

    try {
      const order = await apiFetch<OrderView>("/orders", {
        method: "POST",
        body: JSON.stringify({
          game_slug: game.slug,
          product_code: product.code,
          user_id: userId.trim(),
          zone: game.kind === "game" && zone.trim() ? zone.trim() : undefined,
          contact: contact.trim(),
          idempotency_key: idempotencyKey.current,
        }),
      });

      navigate(`/checkout/${order.invoice}`);
    } catch (submitError) {
      setFormError(errorMessage(submitError));
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-6 text-sm text-rose-200">
        Game tidak ditemukan atau katalog belum tersedia.{" "}
        <Link to="/" className="underline">
          Kembali ke katalog
        </Link>
        .
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-300">
          Katalog
        </Link>
        <span>/</span>
        <span className="text-slate-300">{game.name}</span>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-xl font-black text-white">
          {fileUrl(game.icon_url) ? (
            <img
              src={fileUrl(game.icon_url)!}
              alt={game.name}
              className="h-12 w-12 rounded-lg object-contain"
            />
          ) : (
            game.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{game.name}</h1>
          <p className="text-sm text-slate-400">
            {products.length} pilihan tersedia · proses otomatis
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Pilih nominal
              </h2>
              {products.length > 0 && (
                <span className="text-xs text-slate-500">
                  {visibleProducts.length} dari {products.length} pilihan
                </span>
              )}
            </div>

            {products.length > 0 && (
              <input
                type="search"
                value={productQuery}
                onChange={(event) => setProductQuery(event.target.value)}
                placeholder="Cari nominal (mis. 86, weekly)"
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
              />
            )}

            {products.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                Belum ada nominal tersedia untuk game ini.
              </p>
            ) : visibleProducts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                Tidak ada nominal yang cocok dengan pencarian.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleProducts.map((item) => {
                  const active = selected === item.code;

                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setSelected(item.code)}
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-cyan-400/70 bg-cyan-400/10 ring-1 ring-cyan-400/30"
                          : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="block text-sm font-medium text-slate-100">
                        {item.name}
                      </span>
                      <span
                        className={`mt-1 block text-sm font-bold ${
                          active ? "text-cyan-300" : "text-slate-300"
                        }`}
                      >
                        {item.price_label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-semibold text-slate-100">
              Data akun & kontak
            </h2>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  {game.user_id_label}
                </label>
                <input
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder={`Masukkan ${game.user_id_label}`}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
                />
              </div>

              {game.kind === "game" && (
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">
                    {game.zone_label}
                    {!game.requires_zone && " (opsional)"}
                  </label>
                  <input
                    value={zone}
                    onChange={(event) => setZone(event.target.value)}
                    placeholder={
                      game.requires_zone
                        ? `Masukkan ${game.zone_label}`
                        : "Kosongkan jika tidak diperlukan"
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
                  />
                  {!game.requires_zone && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Isi hanya jika game memerlukan zone/server.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  WhatsApp / Email
                </label>
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="08xxxxxxxxxx atau nama@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Dipakai untuk menghubungi kamu bila ada kendala pesanan.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold text-slate-100">
            Ringkasan pesanan
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Game</span>
              <span className="text-right text-slate-100">{game.name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Nominal</span>
              <span className="text-right text-slate-100">
                {product?.name ?? "Belum dipilih"}
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between border-t border-white/10 pt-3">
            <span className="text-sm text-slate-400">Total</span>
            <span className="text-2xl font-bold text-cyan-300">
              {product?.price_label ?? "-"}
            </span>
          </div>

          {formError && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Membuat pesanan..." : "Beli sekarang"}
          </button>
          <p className="text-center text-[11px] text-slate-500">
            Dengan membeli, kamu setuju data akun dipakai untuk proses top-up.
          </p>
        </aside>
      </div>
    </form>
  );
}
