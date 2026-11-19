import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL;
// In production, never fallback to localhost; always use relative '/api' or explicit remote URL
const API_BASE_URL = import.meta.env.PROD
  ? (rawUrl && !rawUrl.includes('localhost') ? rawUrl : '/api')
  : (rawUrl || 'http://localhost:5000/api');

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

