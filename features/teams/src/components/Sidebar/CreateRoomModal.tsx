'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@xgen/i18n';
import * as teamsApi from '../../api/teams-api';
import type { TeamsLLMModel } from '../../api/teams-api';
import styles from './TeamsSidebar.module.scss';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (
    name: string,
    description?: string,
    llmModel?: string
  ) => Promise<void>;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [llmModels, setLlmModels] = useState<TeamsLLMModel[]>([]);
  const [defaultModelId, setDefaultModelId] = useState<string>(
    'claude-haiku-4-5-20251001'
  );
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [llmLoading, setLlmLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await teamsApi.fetchAvailableLLMs();
      if (cancelled) return;
      setLlmModels(res.models);
      setDefaultModelId(res.default_model_id);
      const hasDefault = res.models.some((m) => m.id === res.default_model_id);
      setSelectedModel(
        hasDefault
          ? res.default_model_id
          : res.models[0]?.id ?? res.default_model_id
      );
      setLlmLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || creating) return;

      setCreating(true);
      try {
        await onCreate(
          name.trim(),
          description.trim() || undefined,
          selectedModel || undefined
        );
        onClose();
      } finally {
        setCreating(false);
      }
    },
    [name, description, creating, selectedModel, onCreate, onClose]
  );

  // provider별 그룹핑 (optgroup 렌더용)
  const groupedModels = React.useMemo(() => {
    const groups = new Map<string, { label: string; models: TeamsLLMModel[] }>();
    for (const m of llmModels) {
      const g = groups.get(m.provider);
      if (g) {
        g.models.push(m);
      } else {
        groups.set(m.provider, {
          label: m.provider_display_name || m.provider,
          models: [m],
        });
      }
    }
    return Array.from(groups.values());
  }, [llmModels]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className={styles.modalHeader}>
          <h3>{t('teams.createRoomModal.title')}</h3>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4L12 12M12 4L4 12" />
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label>{t('teams.createRoomModal.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('teams.createRoomModal.namePlaceholder')}
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label>{t('teams.createRoomModal.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('teams.createRoomModal.descriptionPlaceholder')}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.labelWithHelp}>
              Router LLM 모델
              <span
                className={styles.helpIcon}
                title="사용자가 admin 페이지에서 등록한 API key 기준으로 모델을 선택할 수 있습니다. API key가 없는 provider의 모델은 목록에 나타나지 않습니다."
                aria-label="도움말"
              >
                ?
              </span>
            </label>
            {llmLoading ? (
              <div style={{ fontSize: 12, opacity: 0.7 }}>불러오는 중...</div>
            ) : llmModels.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                사용 가능한 LLM이 없습니다. Admin 페이지에서 API key를 먼저 설정하세요.
              </div>
            ) : (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {groupedModels.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {m.id === defaultModelId ? ' (기본값)' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            {t('teams.createRoomModal.cancel')}
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={!name.trim() || creating}>
            {t('teams.createRoomModal.create')}
          </button>
        </div>
      </form>
    </div>
  );
};
