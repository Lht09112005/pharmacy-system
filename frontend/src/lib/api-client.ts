const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1'
).replace(/\/$/, '');

export type ApiErrorBody = {
  code: string;
  message: string;
  details: unknown[];
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiErrorHandler = () => void;
let unauthorizedHandler: ApiErrorHandler | undefined;

export function setUnauthorizedHandler(handler?: ApiErrorHandler) {
  unauthorizedHandler = handler;
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData || options.body instanceof Blob) {
      body = options.body;
    } else {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(options.body);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      body,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Không thể kết nối máy chủ. Vui lòng thử lại.');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  if (!response.ok) {
    const errorPayload =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? (payload as { error?: Partial<ApiErrorBody> }).error
        : undefined;
    const apiError = new ApiError(
      response.status,
      typeof errorPayload?.code === 'string' ? errorPayload.code : 'HTTP_ERROR',
      typeof errorPayload?.message === 'string'
        ? errorPayload.message
        : `Máy chủ phản hồi HTTP ${response.status}.`,
      Array.isArray(errorPayload?.details) ? errorPayload.details : [],
    );
    if (response.status === 401 && options.auth !== false) unauthorizedHandler?.();
    throw apiError;
  }
  if (payload === undefined) {
    throw new ApiError(502, 'INVALID_RESPONSE', 'Máy chủ trả về dữ liệu không hợp lệ.');
  }
  return payload as T;
}

export type HealthResponse = { data: { status: string; service: string } };

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health', { signal, auth: false });
}
