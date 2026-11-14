import { Link } from "react-router-dom";
import { fileUrl, type Game } from "@/lib/api";

const GRADIENTS = [
  "from-violet-600 via-indigo-500 to-blue-600",
  "from-cyan-500 via-sky-500 to-blue-600",
  "from-rose-500 via-pink-500 to-fuchsia-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-indigo-500 via-purple-500 to-fuchsia-600",
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function GameCard({
  game,
  index,
}: {
  game: Game;
  index: number;
}) {
  const soldOut = game.product_count === 0;
  const logo = fileUrl(game.icon_url);
  const tag =
    game.category_label ??
    (game.kind === "app" ? "Aplikasi & Voucher" : null);

  return (
    <Link
      to={`/game/${game.slug}`}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06] ${
        soldOut ? "opacity-60" : ""
      }`}
    >
      <div
        className={`mb-4 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${
          GRADIENTS[index % GRADIENTS.length]
        }`}
      >
        {logo ? (
          <img
            src={logo}
            alt={game.name}
            loading="lazy"
            className="h-16 w-16 rounded-xl object-contain drop-shadow"
          />
        ) : (
          <span className="text-3xl font-black tracking-wider text-white/90 drop-shadow">
            {initials(game.name)}
          </span>
        )}
      </div>

      <h3 className="truncate font-semibold text-slate-100">{game.name}</h3>
      {tag && (
        <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
          {tag}
        </span>
      )}
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          {soldOut ? "Stok belum tersedia" : `Mulai ${game.min_price_label ?? "-"}`}
        </span>
        <span className="text-slate-500">{game.product_count} pilihan</span>
      </div>
    </Link>
  );
}
