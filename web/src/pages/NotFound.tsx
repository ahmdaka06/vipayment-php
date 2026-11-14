import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center">
      <p className="text-sm text-slate-300">Halaman tidak ditemukan.</p>
      <Link to="/" className="mt-2 inline-block text-xs text-cyan-300 underline">
        Kembali ke katalog
      </Link>
    </div>
  );
}
