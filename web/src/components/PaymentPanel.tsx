import { useEffect, useState } from "react";
import {
  API_BASE,
  errorMessage,
  fileUrl,
  formatDate,
  uploadProof,
  type OrderView,
  type PaymentInstruction,
} from "@/lib/api";
import StatusBadge from "./StatusBadge";

function useCountdown(target: string | null): string {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!target) {
      setText("");
      return;
    }

    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (Number.isNaN(diff)) {
        setText("");
        return;
      }
      if (diff <= 0) {
        setText("Waktu habis");
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setText(
        hours > 0
          ? `${hours} jam ${minutes} menit`
          : `${minutes} menit ${seconds} detik`,
      );
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return text;
}

function instructionQrisUrl(instruction: PaymentInstruction): string | null {
  const url = instruction.qris_image_url;
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
  return url;
}

export default function PaymentPanel({
  order,
  onChanged,
}: {
  order: OrderView;
  onChanged: () => void;
}) {
  const payment = order.payment;
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const countdown = useCountdown(
    payment?.status === "pending" ? payment.expires_at : null,
  );

  if (!payment) return null;

  const instruction = payment.instructions;
  const canUpload =
    order.status === "pending_payment" &&
    (payment.status === "pending" || payment.status === "rejected");

  const qrisUrl = instruction ? instructionQrisUrl(instruction) : null;
  const proofUrl = fileUrl(payment.proof_url);

  async function copyInvoice() {
    try {
      await navigator.clipboard.writeText(order.invoice);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function submitProof() {
    if (!file) return;

    setBusy(true);
    setMessage(null);

    try {
      await uploadProof(order.invoice, file);
      setFile(null);
      setMessage("Bukti terkirim. Menunggu verifikasi admin.");
      onChanged();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Pembayaran
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-100">
            {payment.method === "simulation"
              ? "Simulasi"
              : payment.method === "qris"
                ? "QRIS"
                : payment.method === "bank_transfer"
                  ? "Transfer Bank"
                  : "Manual"}
          </p>
        </div>
        <StatusBadge status={payment.status} kind="payment" />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
        <div>
          <p className="text-[11px] text-slate-400">Nominal</p>
          <p className="text-xl font-bold text-cyan-300">{order.amount_label}</p>
        </div>
        <button
          type="button"
          onClick={copyInvoice}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
        >
          {copied ? "Tersalin" : "Salin invoice"}
        </button>
      </div>

      {payment.status === "pending" && countdown && (
        <p className="text-xs text-amber-300">
          Selesaikan pembayaran dalam {countdown}.
        </p>
      )}

      {payment.status === "paid" && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Pembayaran diterima. Pesanan sedang diproses otomatis.
        </div>
      )}

      {payment.status === "awaiting_review" && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
          Bukti bayar diterima. Admin akan memverifikasi pembayaranmu.
        </div>
      )}

      {payment.status === "rejected" && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Bukti bayar ditolak
          {payment.reject_reason ? `: ${payment.reject_reason}` : "."} Silakan
          unggah ulang bukti pembayaran yang benar.
        </div>
      )}

      {instruction && (
        <div className="space-y-3">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
            {instruction.instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>

          {qrisUrl && (
            <div className="rounded-xl border border-white/10 bg-white p-3">
              <img
                src={qrisUrl}
                alt="QRIS pembayaran"
                className="mx-auto max-h-72 w-auto"
              />
            </div>
          )}

          {instruction.bank_accounts.length > 0 && (
            <div className="space-y-2">
              {instruction.bank_accounts.map((account) => (
                <div
                  key={`${account.bank}-${account.account_no}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <p className="text-xs text-slate-400">{account.bank}</p>
                  <p className="font-mono text-lg text-slate-100">
                    {account.account_no}
                  </p>
                  <p className="text-xs text-slate-400">
                    a.n. {account.account_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {proofUrl && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-400">
            Bukti diunggah {formatDate(payment.proof_uploaded_at)}
          </p>
          <a
            href={proofUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-cyan-300 underline underline-offset-2"
          >
            Lihat bukti pembayaran
          </a>
        </div>
      )}

      {canUpload && (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <label className="block text-sm font-medium text-slate-200">
            Unggah bukti bayar
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-400"
          />
          <p className="text-[11px] text-slate-500">
            JPG, PNG, atau WEBP. Maksimal 2 MB.
          </p>
          <button
            type="button"
            disabled={!file || busy}
            onClick={submitProof}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Mengunggah..." : "Kirim bukti pembayaran"}
          </button>
        </div>
      )}

      {message && <p className="text-xs text-slate-300">{message}</p>}
    </div>
  );
}
