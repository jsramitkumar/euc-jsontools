/**
 * Centralized API client.
 * All requests go through the Next.js rewrite proxy (/api/v1/*)
 * which forwards to the Fastify backend — no CORS issues.
 */

const BASE = "/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

interface ApiError {
  code: string;
  message: string;
}

export class ApiRequestError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    const err = json.error as ApiError | undefined;
    throw new ApiRequestError(
      err?.code ?? "UNKNOWN",
      err?.message ?? `Request failed with status ${res.status}`,
      res.status
    );
  }

  return json.data as T;
}

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; name: string | null; role: string; credits: number } }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  register: (email: string, password: string, name?: string) =>
    request<{ token: string; user: { id: string; email: string; name: string | null; role: string; credits: number } }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ email, password, name }) }
    ),

  me: () =>
    request<{ id: string; email: string; name: string | null; role: string; credits: number }>(
      "/auth/me",
      {},
      true
    ),
};

// ---- JSON Tools ----
export const jsonApi = {
  compare: (
    json1: unknown,
    json2: unknown,
    options?: import("@jsontools/shared").CompareOptions
  ) =>
    request<import("@jsontools/shared").CompareResponse>(
      "/compare",
      { method: "POST", body: JSON.stringify({ json1, json2, options }) },
      true
    ),

  beautify: (json: string, indent = 2) =>
    request<{ result: string; isValid: boolean }>(
      "/beautify",
      { method: "POST", body: JSON.stringify({ json, indent }) }
    ),

  validate: (json: string) =>
    request<import("@jsontools/shared").ValidateResponse>(
      "/validate",
      { method: "POST", body: JSON.stringify({ json }) }
    ),

  minify: (json: string) =>
    request<import("@jsontools/shared").MinifyResponse>(
      "/minify",
      { method: "POST", body: JSON.stringify({ json }) }
    ),

  getComparison: (id: string) =>
    request<{ id: string; result: unknown; createdAt: string }>(
      `/comparison/${id}`,
      {},
      true
    ),

  getShared: (token: string) =>
    request<{ id: string; result: unknown; json1: unknown; json2: unknown; createdAt: string }>(
      `/comparison/share/${token}`
    ),
};

// ---- Usage ----
export const usageApi = {
  summary: () =>
    request<import("@jsontools/shared").UsageSummary & { recentLogs: unknown[] }>(
      "/usage",
      {},
      true
    ),
};

// ---- API Keys ----
export const apiKeyApi = {
  list: () =>
    request<import("@jsontools/shared").ApiKey[]>("/api-keys", {}, true),

  create: (name: string) =>
    request<{ id: string; name: string; key: string; keyPrefix: string; createdAt: string }>(
      "/api-keys",
      { method: "POST", body: JSON.stringify({ name }) },
      true
    ),

  revoke: (id: string) =>
    request<{ revoked: boolean }>(
      `/api-keys/${id}`,
      { method: "DELETE" },
      true
    ),
};

// ---- Billing ----
export const billingApi = {
  packages: () =>
    request<import("@jsontools/shared").CreditPackage[]>("/billing/packages"),

  createOrder: (packageId: string) =>
    request<{ orderId: string; amount: number; currency: string; keyId: string }>(
      "/billing/order",
      { method: "POST", body: JSON.stringify({ packageId }) },
      true
    ),

  verify: (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) =>
    request<{ creditsAdded: number }>(
      "/billing/verify",
      { method: "POST", body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) },
      true
    ),
};
