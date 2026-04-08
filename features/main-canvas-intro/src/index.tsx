'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { listAgentflows } from '@xgen/api-client';
import './locales';

// ─────────────────────────────────────────────────────────────
// Storage helpers (mirrors CanvasPage STORAGE_KEYS)
// ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  WORKFLOW_STATE: 'canvas_workflow_state',
  WORKFLOW_NAME: 'canvas_workflow_name',
  WORKFLOW_ID: 'canvas_workflowId',
} as const;

function getStoredState(key: string): any {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setStoredState(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — silent */ }
}

function clearAgentflowSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.WORKFLOW_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.WORKFLOW_NAME);
    sessionStorage.removeItem(STORAGE_KEYS.WORKFLOW_ID);
  } catch { /* silent */ }
}

function generateAgentflowId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** 기존 에이전트플로우 목록에서 고유한 이름 생성 (xgen-frontend 로직 동일) */
function generateUniqueAgentflowName(existingAgentflows: any[]): string {
  const baseName = 'Agentflow';

  const workflowNames = new Set(
    existingAgentflows.map((item) => {
      let name = '';
      if (typeof item === 'string') {
        name = item;
      } else if (typeof item === 'object' && item !== null) {
        name = item.workflow_name || item.name || '';
      }
      return name.replace(/\.json$/i, '').trim();
    }),
  );

  if (!workflowNames.has(baseName)) return baseName;

  const usedNumbers = new Set<number>();
  const pattern = /^Agentflow \((\d+)\)$/;
  workflowNames.forEach((name) => {
    const match = name.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n)) usedNumbers.add(n);
    }
  });

  let next = 1;
  while (usedNumbers.has(next)) next++;
  return `${baseName} (${next})`;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4L16 10L6 16V4Z" fill="currentColor"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Canvas Intro Page
// ─────────────────────────────────────────────────────────────

interface CanvasIntroPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const CanvasIntroPage: React.FC<CanvasIntroPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();

  /** 새 캔버스 만들기: 세션 초기화 → 고유 이름 생성 → /canvas 이동 */
  const handleCreateBlank = useCallback(async () => {
    // 1. 세션 초기화
    clearAgentflowSession();

    // 2. 새 에이전트플로우 ID 생성
    const newId = generateAgentflowId();
    setStoredState(STORAGE_KEYS.WORKFLOW_ID, newId);

    // 3. 기존 목록에서 고유한 이름 생성
    let newName = 'Agentflow';
    try {
      const existing = await listAgentflows();
      newName = generateUniqueAgentflowName(existing);
    } catch {
      // API 실패 시 기본값 사용
    }
    setStoredState(STORAGE_KEYS.WORKFLOW_NAME, newName);

    // 4. 캔버스 에디터로 이동
    router.push('/canvas');
  }, [router]);

  /** 작업 이어하기: 저장된 세션 상태 확인 → /canvas 이동 */
  const handleContinue = useCallback(() => {
    const savedState = getStoredState(STORAGE_KEYS.WORKFLOW_STATE);

    if (!savedState || (!savedState.nodes && !savedState.edges)) {
      toast.error(t('canvasIntro.hero.noDataError'));
      return;
    }

    router.push('/canvas');
  }, [router, toast, t]);

  return (
    <ContentArea title={t('canvasIntro.title')} description={t('canvasIntro.description')}>
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 px-6">
        {/* Action buttons */}
        <div className="flex gap-4 mt-24 mb-16">
          <Button size="lg" onClick={handleCreateBlank} className="gap-2 px-8 h-12 text-base">
            <PlusIcon />
            {t('canvasIntro.hero.createBlank')}
          </Button>
          <Button size="lg" variant="outline" onClick={handleContinue} className="gap-2 px-8 h-12 text-base">
            <PlayIcon />
            {t('canvasIntro.hero.continue')}
          </Button>
        </div>

        {/* Empty area placeholder */}
        <div className="flex-1 w-full max-w-[1000px]" />
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainCanvasIntroFeature: MainFeatureModule = {
  id: 'main-CanvasIntro',
  name: 'Canvas Introduction',
  sidebarSection: 'agentflow',
  sidebarItems: [
    {
      id: 'canvas-intro',
      titleKey: 'sidebar.workflow.canvas.title',
      descriptionKey: 'sidebar.workflow.canvas.description',
      href: '/canvas',
    },
  ],
  routes: {
    'canvas-intro': CanvasIntroPage,
  },
  requiresAuth: true,
};

export default mainCanvasIntroFeature;
