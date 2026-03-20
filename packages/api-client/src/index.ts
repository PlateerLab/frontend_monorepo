// @xgen/api-client
import { API_CONFIG } from '@xgen/config';
export interface IApiClient { get<T>(url: string): Promise<T>; post<T>(url: string, data?: unknown): Promise<T>; put<T>(url: string, data?: unknown): Promise<T>; delete<T>(url: string): Promise<T>; }
class WebApiClient implements IApiClient {
  private async request<T>(method: string, url: string, data?: unknown): Promise<T> {
    const res = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
      method, headers: { ...API_CONFIG.DEFAULT_HEADERS }, body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(`API ${method} ${url}: ${res.status}`);
    return res.json();
  }
  get<T>(url: string) { return this.request<T>('GET', url); }
  post<T>(url: string, data?: unknown) { return this.request<T>('POST', url, data); }
  put<T>(url: string, data?: unknown) { return this.request<T>('PUT', url, data); }
  delete<T>(url: string) { return this.request<T>('DELETE', url); }
}
let instance: IApiClient | null = null;
export function createApiClient(): IApiClient { if (!instance) instance = new WebApiClient(); return instance; }
export type { IApiClient };
