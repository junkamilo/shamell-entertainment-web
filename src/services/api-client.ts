const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...init } = options;
  let url = `${BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url = `${url}?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error ?? `HTTP ${response.status}`);
  }

  return response.json();
}

export const apiClient = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    fetchAPI<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body: unknown, options?: FetchOptions) =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body: unknown, options?: FetchOptions) =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string, options?: FetchOptions) =>
    fetchAPI<T>(endpoint, { ...options, method: "DELETE" }),
};
