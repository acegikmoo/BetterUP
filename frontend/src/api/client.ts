import { getToken, clearToken } from "./token";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() { return this.status === 401; }
  get isNotFound() { return this.status === 404; }
  get isConflict() { return this.status === 409; }
  get isServerError() { return this.status >= 500; }
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  clearToken();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 300
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    if (err instanceof ApiError && err.status < 500) throw err;
    await new Promise((r) => setTimeout(r, delayMs));
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

export interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  noRetry?: boolean;
}

export async function request<T>(
  path: string,
  { headers: extraHeaders, noRetry, ...options }: RequestOptions = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const execute = async (): Promise<T> => {
    let res: Response;

    try {
      res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        ...options,
        headers,
      });
    } catch {
      throw new ApiError(0, "Check your connection and try again");
    }

    if (res.status === 401) {
      redirectToLogin();
      throw new ApiError(401, "Unauthorized");
    }

    if (!res.ok) {
      let message = res.statusText;
      try {
        const data = await res.json();
        message = data.message || JSON.stringify(data);
      } catch {
        try {
          message = await res.text();
        } catch { }
      }
      throw new ApiError(res.status, message);
    }

    const text = await res.text();
    if (!text) return null as unknown as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  };

  return noRetry ? execute() : withRetry(execute);
}
