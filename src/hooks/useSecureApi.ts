import { useState, useEffect } from 'react';
import { get, post, ApiError } from '@/lib/api-client';

interface HealthCheckData {
  status: string;
  timestamp: number;
}

interface ApiResponseData {
  message: string;
  receivedData: any;
  timestamp: number;
}

export function useHealthCheck() {
  const [data, setData] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await get<HealthCheckData>('/api/health', {
);

      setData(response.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`API Error: ${err.message} (Status: ${err.status})`);
      } else {
        setError('Failed to check health');
      }
      console.error('Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, checkHealth };
}

export function useSecureApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendData = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await post<ApiResponseData>('/api/data', data, {
        timeout: 15000,
      });

      return response.data;
    } catch (err) {
      if (err instanceof ApiError) {
        const errorMessage = `API Error: ${err.message} (Status: ${err.status})`;
        setError(errorMessage);
        throw err;
      } else {
        setError('Failed to send data');
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, sendData };
}
