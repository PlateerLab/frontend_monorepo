export const API_CONFIG = {
  BACKEND_GATEWAY_URL: process.env.NEXT_PUBLIC_BACKEND_GATEWAY_URL || 'http://localhost:3100',
  CORE_BASE: process.env.NEXT_PUBLIC_CORE_BASE_URL || 'http://localhost:8000',
  WORKFLOW_BASE: process.env.NEXT_PUBLIC_WORKFLOW_BASE_URL || 'http://localhost:8100',
  DOCUMENT_BASE: process.env.NEXT_PUBLIC_DOCUMENT_BASE_URL || 'http://localhost:8200',
  MCP_STATION_BASE: process.env.NEXT_PUBLIC_MCP_STATION_BASE_URL || 'http://localhost:8300',
  USE_GATEWAY: process.env.NEXT_PUBLIC_USE_BACKEND_GATEWAY === 'true',
};

export const APP_CONFIG = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'XGEN',
  DEFAULT_LOCALE: (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'ko') as 'ko' | 'en',
  ENABLE_ADMIN: process.env.NEXT_PUBLIC_ENABLE_ADMIN !== 'false',
  ENABLE_GUEST: process.env.NEXT_PUBLIC_ENABLE_GUEST === 'true',
  THEME: process.env.NEXT_PUBLIC_THEME || 'default',
};

export const getBackendUrl = (service: 'core' | 'workflow' | 'document' | 'mcp-station'): string => {
  if (API_CONFIG.USE_GATEWAY) return API_CONFIG.BACKEND_GATEWAY_URL;
  const map = { core: API_CONFIG.CORE_BASE, workflow: API_CONFIG.WORKFLOW_BASE, document: API_CONFIG.DOCUMENT_BASE, 'mcp-station': API_CONFIG.MCP_STATION_BASE };
  return map[service];
};
