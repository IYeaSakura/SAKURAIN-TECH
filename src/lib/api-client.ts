import { generateAuthHeaders, validateSecretKey } from './api-auth';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  useAuth?: boolean;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT = 10000;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function createTimeoutPromise(timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    useAuth = true,
    timeout = DEFAULT_TIMEOUT
  } = options;

  if (useAuth && !validateSecretKey()) {
    throw new Error('API_SECRET_KEY is not configured properly');
  }

  const authHeaders = useAuth ? await generateAuthHeaders() : {};
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
    ...authHeaders,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await Promise.race([
      fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      }),
      createTimeoutPromise(timeout),
    ]) as Response;

    let responseData: any;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(
        responseData?.message || `HTTP error! status: ${response.status}`,
        response.status,
        responseData
      );
    }

    return {
      data: responseData,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.message === 'Request timeout') {
      throw new ApiError('Request timeout', 408);
    }

    console.error('API request failed:', error);
    throw new ApiError('Network error', 0, error);
  }
}

export async function get<T = any>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, 'method'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

export async function post<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'POST', body: data });
}

export async function put<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'PUT', body: data });
}

export async function del<T = any>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, 'method'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

export { ApiError };
