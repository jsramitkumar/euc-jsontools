// ============================================================
// Shared types between API and Web (frontend)
// ============================================================

// ---------- Auth ----------
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  credits: number;
  createdAt: string;
}

export type UserRole = "admin" | "user" | "free";

// ---------- API Keys ----------
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string; // e.g. "jt_live_xxxx..."
  createdAt: string;
  lastUsedAt: string | null;
  isActive: boolean;
}

// ---------- JSON Comparison ----------
export interface CompareOptions {
  ignoreOrder?: boolean;
  ignoreCasing?: boolean;
  ignoreWhitespace?: boolean;
  ignorePaths?: string[];
  /** TTL in hours before the comparison is discarded. Default: 12. Max: 168 (7 days). */
  ttlHours?: number;
  /** Optional plaintext password to protect the shared comparison link. */
  accessPassword?: string;
}

export interface CompareRequest {
  json1: unknown;
  json2: unknown;
  options?: CompareOptions;
}

export interface DiffEntry {
  path: string;
  type: "added" | "removed" | "modified" | "unchanged";
  oldValue?: unknown;
  newValue?: unknown;
}

export interface ComparisonSummary {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  isEqual: boolean;
}

export interface CompareResponse {
  comparisonId: string;
  status: "success" | "error";
  summary: ComparisonSummary;
  differences: DiffEntry[];
  imageUrl: string | null;
  htmlUrl: string | null;
  shareToken: string | null;
  processingTimeMs: number;
  expiresAt: string;
  isProtected: boolean;
}

// ---------- Utility Endpoints ----------
export interface BeautifyRequest {
  json: string;
  indent?: number;
}

export interface BeautifyResponse {
  result: string;
  isValid: boolean;
}

export interface ValidateRequest {
  json: string;
}

export interface ValidateResponse {
  isValid: boolean;
  errors: string[];
  stats: {
    keys: number;
    depth: number;
    size: number;
  } | null;
}

export interface MinifyRequest {
  json: string;
}

export interface MinifyResponse {
  result: string;
  originalSize: number;
  minifiedSize: number;
  reductionPercent: number;
}

// ---------- Billing ----------
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInr: number;
  pricePerCredit: number;
  isPopular?: boolean;
}

export interface PurchaseRecord {
  id: string;
  credits: number;
  amountInr: number;
  status: "pending" | "paid" | "failed" | "refunded";
  razorpayOrderId: string | null;
  createdAt: string;
}

// ---------- Usage ----------
export interface UsageLog {
  id: string;
  endpoint: string;
  creditsUsed: number;
  statusCode: number;
  processingTimeMs: number;
  createdAt: string;
}

export interface UsageSummary {
  totalRequests: number;
  totalCreditsUsed: number;
  remainingCredits: number;
  requestsByEndpoint: Record<string, number>;
}

// ---------- API Responses ----------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    processingTimeMs: number;
  };
}

// ---------- Pagination ----------
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
