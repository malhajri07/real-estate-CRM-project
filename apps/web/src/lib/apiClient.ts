/**
 * apiClient.ts - Unified API Client
 *
 * Single abstraction for all API requests. Use this instead of
 * raw fetch or scattered apiRequest calls.
 */

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }
  return res as unknown as T;
}

export interface ApiClientOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Unified API request. Uses queryKey as URL for GET, or pass full path.
 */
export async function apiClient<T = unknown>(
  pathOrUrl: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { method = "GET", body, headers: extraHeaders = {} } = options;
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `/${pathOrUrl.replace(/^\//, "")}`;

  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...extraHeaders,
  };
  if (body && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  return handleResponse<T>(res);
}

/** GET request - path can be "api/leads" or "/api/leads" */
export const apiGet = <T = unknown>(path: string) =>
  apiClient<T>(path, { method: "GET" });

/** POST request */
export const apiPost = <T = unknown>(path: string, body?: unknown) =>
  apiClient<T>(path, { method: "POST", body });

/** PUT request */
export const apiPut = <T = unknown>(path: string, body?: unknown) =>
  apiClient<T>(path, { method: "PUT", body });

/** PATCH request */
export const apiPatch = <T = unknown>(path: string, body?: unknown) =>
  apiClient<T>(path, { method: "PATCH", body });

/** DELETE request */
export const apiDelete = <T = unknown>(path: string) =>
  apiClient<T>(path, { method: "DELETE" });
