'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiUser } from '@xgen/icons';
import { updatePrompt } from '../api/prompt-api';
import type { Prompt } from '../types';

const PS = 'admin.agentflowManagement.promptStore';
const EM = `${PS}.editModal`;

interface PromptEditModalProps {
  isOpen: boolean;
  prompt: Prompt;
  onClose: () => void;
  onUpdated: () => void;
}

const TITLE_MAX = 100;
const CONTENT_MAX = 5000;

const PromptEditModal: React.FC<PromptEditModalProps> = ({
  isOpen,
  prompt,
  onClose,
  onUpdated,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [title, setTitle] = useState(prompt.prompt_title);
  const [content, setContent] = useState(prompt.prompt_content);
  const [language, setLanguage] = useState<'ko' | 'en'>(
    prompt.language === 'en' ? 'en' : 'ko',
  );
  const [promptType, setPromptType] = useState<'user' | 'system'>(
    prompt.prompt_type,
  );
  const [publicAvailable, setPublicAvailable] = useState(
    prompt.public_available,
  );
  const [isTemplate, setIsTemplate] = useState(prompt.is_template);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTitle(prompt.prompt_title);
    setContent(prompt.prompt_content);
    setLanguage(prompt.language === 'en' ? 'en' : 'ko');
    setPromptType(prompt.prompt_type);
    setPublicAvailable(prompt.public_available);
    setIsTemplate(prompt.is_template);
    setErrors({});
  }, [prompt]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim()) {
      next.title = t(`${EM}.promptTitleRequired`);
    } else if (title.length > TITLE_MAX) {
      next.title = t(`${EM}.promptTitleMaxLength`);
    }
    if (!content.trim()) {
      next.content = t(`${EM}.promptContentRequired`);
    } else if (content.length > CONTENT_MAX) {
      next.content = t(`${EM}.promptContentMaxLength`);
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await updatePrompt({
        prompt_uid: prompt.prompt_uid,
        prompt_title: title.trim(),
        prompt_content: content.trim(),
        prompt_type: promptType,
        public_available: publicAvailable,
        is_template: isTemplate,
        language,
      });
      toast.success(t(`${PS}.toast.editSuccess`));
      onUpdated();
      onClose();
    } catch {
      toast.error(t(`${PS}.toast.editError`));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(`${EM}.title`)}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t(`${EM}.cancel`)}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {submitting ? t(`${EM}.submitting`) : t(`${EM}.submit`)}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left column — title + content */}
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t(`${EM}.promptTitle`)}
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={t(`${EM}.promptTitlePlaceholder`)}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.title && (
                <span className="text-xs text-red-500">{errors.title}</span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {title.length}/{TITLE_MAX}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col">
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t(`${EM}.promptContent`)}
            </label>
            <textarea
              className="min-h-[200px] flex-1 resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={t(`${EM}.promptContentPlaceholder`)}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={CONTENT_MAX}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.content && (
                <span className="text-xs text-red-500">{errors.content}</span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {content.length}/{CONTENT_MAX}
              </span>
            </div>
          </div>
        </div>

        {/* Right column — settings */}
        <div className="flex flex-col gap-5">
          {/* Original author info */}
          {prompt.user_id && (
            <div className="rounded-md border border-border bg-muted/50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <FiUser className="h-4 w-4" />
                {t(`${EM}.originalAuthor`)}
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  {t(`${EM}.userId`)}: {prompt.user_id}
                </div>
                {prompt.username && (
                  <div>
                    {t(`${EM}.username`)}: {prompt.username}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Language toggle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t(`${EM}.language`)}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  language === 'ko'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
                onClick={() => setLanguage('ko')}
              >
                {t(`${EM}.korean`)}
              </button>
              <button
                type="button"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
                onClick={() => setLanguage('en')}
              >
                {t(`${EM}.english`)}
              </button>
            </div>
          </div>

          {/* Prompt type toggle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t(`${EM}.promptType`)}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  promptType === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
                onClick={() => setPromptType('user')}
              >
                {t(`${EM}.userPrompt`)}
              </button>
              <button
                type="button"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  promptType === 'system'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
                onClick={() => setPromptType('system')}
              >
                {t(`${EM}.systemPrompt`)}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {promptType === 'system'
                ? t(`${EM}.systemPromptDescription`)
                : t(`${EM}.userPromptDescription`)}
            </p>
          </div>

          {/* Public checkbox */}
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              checked={publicAvailable}
              onChange={(e) => setPublicAvailable(e.target.checked)}
            />
            <div>
              <span className="text-sm font-medium text-foreground">
                {t(`${EM}.setAsPublic`)}
              </span>
              <p className="text-xs text-muted-foreground">
                {t(`${EM}.publicDescription`)}
              </p>
            </div>
          </label>

          {/* Template checkbox */}
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              checked={isTemplate}
              onChange={(e) => setIsTemplate(e.target.checked)}
            />
            <div>
              <span className="text-sm font-medium text-foreground">
                {t(`${EM}.setAsTemplate`)}
              </span>
              <p className="text-xs text-muted-foreground">
                {t(`${EM}.templateDescription`)}
              </p>
            </div>
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default PromptEditModal;
