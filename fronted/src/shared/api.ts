const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown; // Objetos, strings, FormData, etc.
}

export class ApiError extends Error {
  readonly type: string;
  readonly details?: Record<string, string[]>;

  constructor(message: string, type = "UNKNOWN_ERROR", details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.details = details;
  }
}

function normalizeDetails(raw: unknown): Record<string, string[]> | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;

  let source = raw as Record<string, unknown>;

  // BadRequestError del backend anida los detalles: { details: { campo: [...] } }
  const keys = Object.keys(source);
  if (keys.length === 1 && keys[0] === "details" && typeof source.details === "object" && source.details !== null) {
    source = source.details as Record<string, unknown>;
  }

  const entries = Object.entries(source).flatMap<[string, string[]]>(([key, value]) => {
    if (typeof value === "string") return [[key, [value]]];
    if (Array.isArray(value) && value.every((v) => typeof v === "string")) return [[key, value as string[]]];
    return [];
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function buildApiError(status: number, statusText: string, body: unknown): ApiError {
  const fallbackMessage = statusText?.trim() || `Error ${status}`;
  const fallbackType = `HTTP_${status}`;

  if (typeof body === "string") {
    return body.trim() ? new ApiError(body, fallbackType) : new ApiError(fallbackMessage, fallbackType);
  }

  if (typeof body !== "object" || body === null) {
    return new ApiError(fallbackMessage, fallbackType);
  }

  const root = body as Record<string, unknown>;
  const payload: unknown = "error" in root ? root.error : root;

  if (typeof payload === "string") {
    return payload.trim()
      ? new ApiError(payload, fallbackType)
      : new ApiError(fallbackMessage, fallbackType);
  }

  if (typeof payload !== "object" || payload === null) {
    return new ApiError(fallbackMessage, fallbackType);
  }

  const err = payload as Record<string, unknown>;
  const message = typeof err.message === "string" && err.message.trim() ? err.message : fallbackMessage;
  const type =
    typeof err.type === "string" && err.type.trim()
      ? err.type
      : typeof err.code === "string" && err.code.trim()
        ? err.code
        : fallbackType;
  const details = normalizeDetails(err.details);
  const detailMessage = details
    ? Object.entries(details)
        .flatMap(([field, messages]) =>
          messages.map((detail) => (field === "body" ? detail : `${field}: ${detail}`))
        )
        .join(" · ")
    : "";
  const finalMessage = detailMessage || message;

  return new ApiError(finalMessage, type, details);
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {

  const token = localStorage.getItem("token");

  const isJsonBody = options.body && typeof options.body === 'object' && !(options.body instanceof FormData);
  const url = `${BASE_URL}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: isJsonBody ? JSON.stringify(options.body) : (options.body as BodyInit | null | undefined),
  };

  const response = await fetch(`${url}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    let body: unknown = null;
    try {
      const raw = await response.text();
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }

    throw buildApiError(response.status, response.statusText, body);
  }

  if (response.status === 204) return {} as T;

  return response.json();
}
