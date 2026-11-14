import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { href: "/", label: "Katalog" },
  { href: "/lacak", label: "Lacak Invoice" },
];

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#060a12]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-black text-white shadow-lg shadow-indigo-500/20">
            TK
          </span>
          <span className="text-sm font-semibold tracking-wide text-slate-100">
            TopUp<span className="text-cyan-300">Kilat</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                to={link.href}
                className={`rounded-lg px-3 py-2 transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
