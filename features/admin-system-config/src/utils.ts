import React from 'react';
import {
  FiDatabase, FiSettings, FiCpu, FiLayers,
  FiServer, FiImage,
} from '@xgen/icons';
import { SiOpenai, SiAnthropic, RiGeminiFill, FaAws, BsDatabaseUp } from '@xgen/icons';

import type { CategoryType } from './types';
import { SENSITIVE_FIELDS } from './constants';

// ─────────────────────────────────────────────────────────────
// Category helpers
// ─────────────────────────────────────────────────────────────

export function getConfigCategory(configPath: string): CategoryType {
  const path = configPath.toLowerCase();
  if (path.startsWith('database.')) return 'database';
  if (path.startsWith('openai.')) return 'openai';
  if (path.startsWith('app.')) return 'app';
  if (path.startsWith('workflow.')) return 'workflow';
  if (path.startsWith('node.')) return 'node';
  if (path.startsWith('vectordb.')) return 'vectordb';
  if (path.startsWith('gemini.')) return 'gemini';
  if (path.startsWith('anthropic.')) return 'anthropic';
  if (path.startsWith('aws.')) return 'aws';
  if (path.startsWith('vision_language.')) return 'vision_language';
  return 'other';
}

const CATEGORY_ICON: Record<CategoryType, React.ReactNode> = {
  database: React.createElement(FiDatabase),
  openai: React.createElement(SiOpenai),
  app: React.createElement(FiServer),
  workflow: React.createElement(FiLayers),
  node: React.createElement(FiCpu),
  vectordb: React.createElement(BsDatabaseUp),
  gemini: React.createElement(RiGeminiFill),
  anthropic: React.createElement(SiAnthropic),
  aws: React.createElement(FaAws),
  vision_language: React.createElement(FiImage),
  other: React.createElement(FiSettings),
};

export function getCategoryIcon(category: CategoryType): React.ReactNode {
  return CATEGORY_ICON[category] ?? React.createElement(FiSettings);
}

const CATEGORY_COLOR: Record<CategoryType, string> = {
  database: '#336791', openai: '#10a37f', app: '#0078d4',
  workflow: '#ff6b35', node: '#6366f1', vectordb: '#023196',
  gemini: '#6b5b9a', anthropic: '#a45d7c', aws: '#ff9900',
  vision_language: '#4b8bbe', other: '#6b7280',
};

export function getCategoryColor(category: CategoryType): string {
  return CATEGORY_COLOR[category] ?? '#6b7280';
}

// ─────────────────────────────────────────────────────────────
// Value helpers
// ─────────────────────────────────────────────────────────────

export function isSensitive(envName: string): boolean {
  return SENSITIVE_FIELDS.some((f) => envName.includes(f));
}

export function formatValue(value: unknown, envName?: string): string {
  if (value === null || value === undefined) return 'N/A';
  if (envName && isSensitive(envName) && typeof value === 'string' && value.length > 8) {
    return value.substring(0, 8) + '*'.repeat(Math.min(value.length - 8, 20)) + '...';
  }
  if (Array.isArray(value)) return value.join(', ');
  const str = String(value);
  return str.length > 50 ? str.substring(0, 47) + '...' : str;
}

export function getValueType(value: unknown): string {
  if (Array.isArray(value)) return 'Array';
  if (typeof value === 'boolean') return 'Bool';
  if (typeof value === 'number') return 'Num';
  if (typeof value === 'string') return 'Str';
  return 'Unknown';
}

export function validateValue(
  value: string,
  type: string,
): { isValid: boolean; parsedValue: unknown; error?: string } {
  switch (type.toLowerCase()) {
    case 'bool': {
      const v = value.toLowerCase().trim();
      if (v === 'true') return { isValid: true, parsedValue: true };
      if (v === 'false') return { isValid: true, parsedValue: false };
      return { isValid: false, parsedValue: null, error: 'Must be "true" or "false"' };
    }
    case 'num': {
      const n = Number(value);
      if (isNaN(n)) return { isValid: false, parsedValue: null, error: 'Invalid number' };
      return { isValid: true, parsedValue: n };
    }
    case 'array': {
      try {
        const arr = JSON.parse(value);
        if (Array.isArray(arr)) return { isValid: true, parsedValue: arr };
      } catch {
        // fallback: comma-separated
      }
      const arr = value.split(',').map((s) => s.trim()).filter(Boolean);
      return { isValid: true, parsedValue: arr };
    }
    default:
      return { isValid: true, parsedValue: value };
  }
}
