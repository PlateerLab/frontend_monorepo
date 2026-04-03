import { createApiClient } from '@xgen/api-client';

const api = createApiClient();

export async function fetchAllConfigs() {
  const res = await api.get<{ persistent_summary: { configs: unknown[] } }>(
    '/api/config/persistent',
  );
  return res.data;
}

export async function updateConfig(configName: string, value: unknown) {
  const res = await api.put<unknown>(
    `/api/config/persistent/${encodeURIComponent(configName)}`,
    { value },
  );
  return res.data;
}

export async function refreshConfigs() {
  const res = await api.post<unknown>('/api/config/persistent/refresh');
  return res.data;
}
