const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
}

function getToken(): string | null {
  const stored = localStorage.getItem('auth');
  if (!stored) return null;
  try {
    return JSON.parse(stored).token;
  } catch {
    return null;
  }
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;

  const token = getToken();
  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Error ${response.status}`);
  }

  return data;
}

// Convenience methods
export const api = {
  get: <T = unknown>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T = unknown>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, { method: 'POST', body }),
  put: <T = unknown>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, { method: 'PUT', body }),
  patch: <T = unknown>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body }),
  delete: <T = unknown>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
  upload: <T = unknown>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, { method: 'POST', body: formData }),
};
