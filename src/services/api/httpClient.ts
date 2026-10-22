import { API_BASE_URL } from '../repositories/mode';

export interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function requestJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  if (!API_BASE_URL) {
    throw new ApiRequestError('Set VITE_API_BASE_URL before using API mode.', 0, 'API_BASE_URL_MISSING');
  }
  const headers = new Headers(init?.headers);
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  if (init?.body && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, { ...init, headers });
  } catch (error) {
    throw new ApiRequestError(error instanceof Error ? error.message : 'Network request failed.', 0, 'NETWORK_ERROR');
  }
  const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    const errorBody = body as ApiErrorBody | undefined;
    throw new ApiRequestError(errorBody?.message ?? `Request failed with status ${response.status}.`, response.status, errorBody?.code, errorBody?.details);
  }
  return body as TResponse;
}
