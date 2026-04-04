'use client';

import { createApiClient } from './index';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type CrawlerSessionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface CrawlerSessionSummary {
  session_id: string;
  run_id: string;
  seed_url: string;
  status: CrawlerSessionStatus;
  processed_pages: number;
  pending_pages: number;
  total_enqueued: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  message?: string | null;
  error?: string | null;
}

export interface CrawlerSessionDetail extends CrawlerSessionSummary {
  config?: Record<string, unknown>;
}

export interface CreateCrawlerSessionRequest {
  seed_url: string;
  max_pages?: number;
  max_depth?: number;
  allowed_domains?: string[];
}

export interface CrawlerPage {
  page_id: string;
  url: string;
  status: string;
  title?: string;
  content_length?: number;
  crawled_at?: string;
}

export interface CrawlerPagesResponse {
  pages: CrawlerPage[];
  total: number;
  page: number;
  page_size: number;
}

export interface StartIndexingRequest {
  session_id: string;
  document_ids?: string[];
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

function getClient() {
  const raw = createApiClient();
  return {
    async get<T>(endpoint: string, config?: Parameters<typeof raw.get>[1]): Promise<T> {
      const res = await raw.get<T>(endpoint, config);
      return res.data;
    },
    async post<T>(endpoint: string, body?: unknown, config?: Parameters<typeof raw.post>[2]): Promise<T> {
      const res = await raw.post<T>(endpoint, body, config);
      return res.data;
    },
    async delete<T>(endpoint: string, body?: unknown, config?: Parameters<typeof raw.delete>[2]): Promise<T> {
      const res = await raw.delete<T>(endpoint, body, config);
      return res.data;
    },
    raw,
  };
}

/** 크롤러 세션 목록 */
export async function getCrawlerSessions(): Promise<CrawlerSessionSummary[]> {
  const client = getClient();
  return client.get<CrawlerSessionSummary[]>('/api/admin/crawler/sessions');
}

/** 크롤러 세션 상세 */
export async function getCrawlerSessionDetail(sessionId: string): Promise<CrawlerSessionDetail> {
  const client = getClient();
  return client.get<CrawlerSessionDetail>(`/api/admin/crawler/sessions/${encodeURIComponent(sessionId)}`);
}

/** 크롤러 세션 생성 */
export async function createCrawlerSession(
  request: CreateCrawlerSessionRequest,
): Promise<CrawlerSessionSummary> {
  const client = getClient();
  return client.post<CrawlerSessionSummary>('/api/admin/crawler/sessions', {
    body: request,
  });
}

/** 크롤러 세션 취소 */
export async function cancelCrawlerSession(sessionId: string): Promise<void> {
  const client = getClient();
  await client.post<void>(`/api/admin/crawler/sessions/${encodeURIComponent(sessionId)}/cancel`);
}

/** 크롤러 세션 데이터 삭제 */
export async function deleteCrawlerSessionData(sessionId: string): Promise<void> {
  const client = getClient();
  await client.delete<void>(`/api/admin/crawler/sessions/${encodeURIComponent(sessionId)}`);
}

/** 크롤러 수집 페이지 목록 */
export async function getCrawlerPages(
  sessionId: string,
  page: number = 1,
  pageSize: number = 50,
): Promise<CrawlerPagesResponse> {
  const client = getClient();
  return client.get<CrawlerPagesResponse>(`/api/admin/crawler/sessions/${encodeURIComponent(sessionId)}/pages`, {
    params: { page: String(page), page_size: String(pageSize) },
  });
}

/** 크롤러 페이지 상세 */
export async function getCrawlerPageDetail(
  sessionId: string,
  pageId: string,
): Promise<CrawlerPage> {
  const client = getClient();
  return client.get<CrawlerPage>(`/api/admin/crawler/sessions/${encodeURIComponent(sessionId)}/pages/${encodeURIComponent(pageId)}`);
}

/** 인덱싱 시작 */
export async function startCrawlerSessionIndexing(
  request: StartIndexingRequest,
): Promise<{ status: string }> {
  const client = getClient();
  return client.post<{ status: string }>('/api/admin/crawler/indexing', {
    body: request,
  });
}

/** 문서 통합 */
export async function integrateCrawlerSessionDocuments(
  sessionId: string,
): Promise<{ status: string }> {
  const client = getClient();
  return client.post<{ status: string }>(`/api/admin/crawler/sessions/${encodeURIComponent(sessionId)}/integrate`);
}

/**
 * SSE 기반 크롤러 세션 이벤트 구독
 * @returns cleanup 함수
 */
export function subscribeToCrawlerSessionEvents(
  sessionId: string,
  onData: (event: { type: string; data: unknown }) => void,
  onError?: (error: string) => void,
): () => void {
  const client = getClient();
  const baseUrl = (client as unknown as { config: { baseUrl: string } }).config.baseUrl;
  const url = `${baseUrl}/api/admin/crawler/sessions/${encodeURIComponent(sessionId)}/events`;

  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onData({ type: 'message', data });
    } catch {
      // skip parse errors
    }
  };

  eventSource.onerror = () => {
    onError?.('SSE connection error');
  };

  return () => {
    eventSource.close();
  };
}
