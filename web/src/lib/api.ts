export const API_BASE = (
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8080"
).replace(/\/$/, "");

export type Game = {
  slug: string;
  name: string;
  icon_url: string | null;
  requires_zone: boolean;
  user_id_label: string;
  zone_label: string;
  kind: string;
  category: string | null;
  category_label: string | null;
  product_count: number;
  min_price: number | null;
  min_price_label: string | null;
};

export type GameInfo = Omit<Game, "product_count" | "min_price" | "min_price_label">;

export type Product = {
  code: string;
  name: string;
  sell_price: number;
  price_label: string;
};

export type BankAccount = {
  bank: string;
  account_no: string;
  account_name: string;
};

export type PaymentInstruction = {
  provider: string;
  method: string;
  amount: number;
  qris_image_url: string | null;
  bank_accounts: BankAccount[];
  instructions: string[];
  expires_at: string;
};

export type OrderEvent = {
  from: string | null;
  to: string;
  note: string | null;
  at: string;
};

export type OrderView = {
  invoice: string;
  status: string;
  amount: number;
  amount_label: string;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  game: {
    slug: string;
    name: string;
    icon_url: string | null;
    requires_zone: boolean;
  } | null;
  product: { code: string; name: string };
  account: {
    user_id: string;
    zone: string | null;
    user_id_label: string;
    zone_label: string;
  };
  contact: string;
  provider: {
    trxid: string | null;
    status: string | null;
    sn: string | null;
    failure_reason: string | null;
  };
  payment: {
    status: string;
    status_kind: string | null;
    provider: string;
    method: string;
    amount: number;
    proof_url: string | null;
    proof_uploaded_at: string | null;
    expires_at: string;
    reject_reason: string | null;
    instructions: PaymentInstruction | null;
  } | null;
  events: OrderEvent[];
};

export type AdminPayment = {
  invoice: string;
  game_slug: string;
  product_name: string;
  user_id: string;
  zone: string | null;
  contact: string;
  amount: number;
  amount_label: string;
  order_status: string;
  provider_trxid: string | null;
  provider_status: string | null;
  payment_status: string;
  method: string;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  expires_at: string;
  reject_reason: string | null;
  created_at: string;
};

export type AdminOrder = {
  invoice: string;
  game_slug: string;
  product_name: string;
  user_id: string;
  zone: string | null;
  contact: string;
  amount: number;
  status: string;
  provider_trxid: string | null;
  provider_status: string | null;
  provider_sn: string | null;
  submit_attempts: number;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
};

export type AdminProfile = {
  profile: {
    username?: string;
    name?: string;
    balance?: number | string;
    level?: string;
    status?: string;
  } | null;
  signature_ok: boolean;
  markup_percent: number;
  markup_by_category: Record<string, number>;
  markup_fixed_by_category: Record<string, number>;
};

export type SyncReport = {
  groups: number;
  products: number;
  logos: number;
  errors: string[];
};

export type LookupOrder = {
  invoice: string;
  product_name: string;
  amount: number;
  amount_label: string;
  status: string;
  created_at: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  { token, ...init }: RequestInit & { token?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : response.statusText;
    const code =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error)
        : undefined;

    throw new ApiError(message || "Permintaan gagal", response.status, code);
  }

  return payload as T;
}

export function fetcher<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

export async function uploadProof(invoice: string, file: File): Promise<void> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(
    `${API_BASE}/api/v1/orders/${encodeURIComponent(invoice)}/payment-proof`,
    { method: "POST", body: form },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      payload?.message ?? "Upload bukti bayar gagal",
      response.status,
    );
  }
}

export function fileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Terjadi kesalahan. Coba lagi.";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type StatusInfo = { label: string; tone: string };

const ORDER_STATUS: Record<string, StatusInfo> = {
  pending_payment: { label: "Menunggu pembayaran", tone: "amber" },
  paid: { label: "Pembayaran diterima", tone: "blue" },
  submitting: { label: "Mengirim ke provider", tone: "blue" },
  processing: { label: "Sedang diproses", tone: "purple" },
  success: { label: "Berhasil", tone: "green" },
  failed: { label: "Gagal", tone: "red" },
  refund_pending: { label: "Menunggu refund", tone: "red" },
  refunded: { label: "Sudah direfund", tone: "slate" },
  expired: { label: "Kedaluwarsa", tone: "slate" },
  needs_attention: { label: "Perlu tindakan admin", tone: "red" },
};

const PAYMENT_STATUS: Record<string, StatusInfo> = {
  pending: { label: "Belum dibayar", tone: "amber" },
  awaiting_review: { label: "Menunggu verifikasi", tone: "purple" },
  paid: { label: "Lunas", tone: "green" },
  rejected: { label: "Bukti ditolak", tone: "red" },
  expired: { label: "Kedaluwarsa", tone: "slate" },
};

export function orderStatusInfo(status: string): StatusInfo {
  return ORDER_STATUS[status] ?? { label: status, tone: "slate" };
}

export function paymentStatusInfo(status: string): StatusInfo {
  return PAYMENT_STATUS[status] ?? { label: status, tone: "slate" };
}
