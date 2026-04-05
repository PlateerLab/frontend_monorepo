'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

export interface PromptAPIResponse {
  id: number;
  prompt_uid: string;
  prompt_title: string;
  prompt_content: string;
  prompt_type: 'user' | 'system';
  public_available: boolean;
  is_template: boolean;
  language: string;
  user_id?: string;
  username?: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  rating_count?: number;
  rating_sum?: number;
}

export interface PromptVersionAPIResponse {
  id: number;
  version: string;
  version_label: string;
  prompt_content: string;
  current_use: boolean;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  username?: string;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types
// ─────────────────────────────────────────────────────────────

export interface PromptDetail {
  keyValue: number;
  uid: string;
  title: string;
  content: string;
  type: 'user' | 'system';
  isTemplate: boolean;
  isPublic: boolean;
  language: string;
  author: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
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

function transformPrompt(response: PromptAPIResponse): PromptDetail {
  return {
    keyValue: response.id,
    uid: response.prompt_uid,
    title: response.prompt_title,
    content: response.prompt_content,
    type: response.prompt_type,
    isTemplate: response.is_template,
    isPublic: response.public_available,
    language: response.language,
    author: response.full_name || response.username || 'Unknown',
    userId: response.user_id,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    ratingCount: response.rating_count || 0,
    ratingAvg: response.rating_count && response.rating_count > 0 && response.rating_sum
      ? response.rating_sum / response.rating_count
      : 0,
    variables: extractVariables(response.prompt_content),
  };
}

// ─────────────────────────────────────────────────────────────
// Prompt Storage API
// ─────────────────────────────────────────────────────────────

export async function listPrompts(language?: string, promptType?: string): Promise<PromptDetail[]> {
  const api = createApiClient();
  const params = new URLSearchParams();
  params.set('limit', '100');
  params.set('offset', '0');
  if (language) params.set('language', language);
  if (promptType) params.set('prompt_type', promptType);

  const response = await api.get<{ prompts: PromptAPIResponse[] }>(`/api/prompt/list?${params.toString()}`);
  return (response.data.prompts || []).map(transformPrompt);
}

export async function createPrompt(data: {
  prompt_title: string;
  prompt_content: string;
  public_available: boolean;
  language: string;
  prompt_type: 'user' | 'system';
}): Promise<unknown> {
  const api = createApiClient();
  return api.post('/api/prompt/create', data);
}

export async function updatePrompt(data: {
  prompt_uid: string;
  prompt_title: string;
  prompt_content: string;
  public_available: boolean;
  language: string;
  prompt_type: 'user' | 'system';
}): Promise<unknown> {
  const api = createApiClient();
  return api.post('/api/prompt/update', data);
}

export async function deletePrompt(promptUid: string): Promise<unknown> {
  const api = createApiClient();
  return api.delete('/api/prompt/delete', { data: { prompt_uid: promptUid } });
}

export async function uploadToPromptStore(promptId: number): Promise<unknown> {
  const api = createApiClient();
  return api.post(`/api/prompt/store/upload?prompt_id=${promptId}`);
}
