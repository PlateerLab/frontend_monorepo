'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

export interface PromptStoreAPIResponse {
  id: number;
  prompt_upload_id: string;
  prompt_data: string | {
    prompt_title: string;
    prompt_content: string;
    prompt_type: string;
    is_template: boolean;
    language: string;
  };
  user_id: string;
  username: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  rating_count: number;
  rating_sum: number;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types
// ─────────────────────────────────────────────────────────────

export interface StorePrompt {
  keyValue: number;
  uploadId: string;
  title: string;
  content: string;
  type: string;
  isTemplate: boolean;
  language: string;
  author: string;
  userId: string;
  createdAt: string;
  ratingCount: number;
  ratingAvg: number;
  variables: string[];
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
}

function transformStorePrompt(response: PromptStoreAPIResponse): StorePrompt {
  let parsed: {
    prompt_title: string;
    prompt_content: string;
    prompt_type: string;
    is_template: boolean;
    language: string;
  };

  if (typeof response.prompt_data === 'string') {
    try {
      parsed = JSON.parse(response.prompt_data);
    } catch {
      parsed = {
        prompt_title: 'Unknown',
        prompt_content: '',
        prompt_type: 'user',
        is_template: false,
        language: 'en',
      };
    }
  } else {
    parsed = response.prompt_data;
  }

  return {
    keyValue: response.id,
    uploadId: response.prompt_upload_id,
    title: parsed.prompt_title,
    content: parsed.prompt_content,
    type: parsed.prompt_type,
    isTemplate: parsed.is_template,
    language: parsed.language,
    author: response.full_name || response.username || 'Unknown',
    userId: response.user_id,
    createdAt: response.created_at,
    ratingCount: response.rating_count || 0,
    ratingAvg: response.rating_count > 0 ? response.rating_sum / response.rating_count : 0,
    variables: extractVariables(parsed.prompt_content),
  };
}

// ─────────────────────────────────────────────────────────────
// Prompt Store API
// ─────────────────────────────────────────────────────────────

export async function listPromptStore(): Promise<StorePrompt[]> {
  const api = createApiClient();
  const response = await api.get<{ prompts: PromptStoreAPIResponse[] }>('/api/prompt/store/list');
  return (response.data.prompts || []).map(transformStorePrompt);
}

export async function downloadFromPromptStore(storeId: number): Promise<unknown> {
  const api = createApiClient();
  return api.post(`/api/prompt/store/download/${storeId}`);
}

export async function deleteFromPromptStore(promptUploadId: string): Promise<unknown> {
  const api = createApiClient();
  return api.delete(`/api/prompt/store/delete/${promptUploadId}`);
}

export async function ratePrompt(
  promptUid: string,
  userId: string,
  isTemplate: boolean,
  rating: number,
): Promise<unknown> {
  const api = createApiClient();
  return api.post(`/api/prompt/rating/${promptUid}?user_id=${userId}&is_template=${isTemplate}&rating=${rating}`);
}
