export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/csrf-cookie`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new ApiError('Could not initialize a secure session with the school API.', response.status);
  }

  const tokenCookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  if (!tokenCookie) {
    throw new ApiError('The school API did not provide a CSRF token.', response.status);
  }

  return decodeURIComponent(tokenCookie.slice('XSRF-TOKEN='.length));
}

export async function apiRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    const method = (init.method || 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      headers.set('X-XSRF-TOKEN', await getCsrfToken());
    }

    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Cannot reach the Laravel API. Start it with `php artisan serve --port=8000` from the project root.', 0);
  }

  if (response.status === 204) return undefined as T;
  const responseText = await response.text();
  let payload: { error?: unknown; message?: unknown; errors?: Record<string, unknown> } = {};
  if (response.status === 502 || response.status === 503 || response.status === 504) {
    throw new ApiError('The Laravel API is not running. Start it with `php artisan serve --port=8000` from the project root.', response.status);
  }
  try {
    payload = responseText ? JSON.parse(responseText) as typeof payload : {};
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const firstValidationError = payload.errors
      ? Object.values(payload.errors).find((messages) => Array.isArray(messages))?.[0]
      : undefined;
    const apiMessage = [payload.error, firstValidationError, payload.message]
      .find((candidate): candidate is string => typeof candidate === 'string');
    const message = apiMessage
      || (response.status >= 500
        ? `The Laravel API returned a server error (HTTP ${response.status}). Check the backend terminal and database configuration.`
        : `The request was rejected (HTTP ${response.status}).`);
    throw new ApiError(message, response.status);
  }
  if (!responseText) throw new ApiError('The Laravel API returned an empty response.', response.status);
  return payload as T;
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}
