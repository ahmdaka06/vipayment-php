import { Route, Routes } from "react-router-dom";
import Header from "@/components/Header";
import Admin from "@/pages/Admin";
import Checkout from "@/pages/Checkout";
import Game from "@/pages/Game";
import Home from "@/pages/Home";
import Invoice from "@/pages/Invoice";
import Lacak from "@/pages/Lacak";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:slug" element={<Game />} />
          <Route path="/checkout/:invoice" element={<Checkout />} />
          <Route path="/invoice/:invoice" element={<Invoice />} />
          <Route path="/lacak" element={<Lacak />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto w-full max-w-6xl px-4 text-center text-xs leading-relaxed text-slate-500">
          TopUp Kilat — pesanan diproses otomatis setelah pembayaran
          diverifikasi. Simpan nomor invoice untuk melacak pesanan.
        </div>
      </footer>
    </>
  );
}
