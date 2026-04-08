'use client';

import React, { useState } from 'react';
import { Modal, Button, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { createPrompt } from '../api/prompt-api';

const PS = 'admin.agentflowManagement.promptStore';
const CM = `${PS}.createModal`;

interface PromptCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const TITLE_MAX = 100;
const CONTENT_MAX = 5000;

const PromptCreateModal: React.FC<PromptCreateModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [promptType, setPromptType] = useState<'user' | 'system'>('user');
  const [publicAvailable, setPublicAvailable] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim()) {
      next.title = t(`${CM}.promptTitleRequired`);
    } else if (title.length > TITLE_MAX) {
      next.title = t(`${CM}.promptTitleMaxLength`);
    }
    if (!content.trim()) {
      next.content = t(`${CM}.promptContentRequired`);
    } else if (content.length > CONTENT_MAX) {
      next.content = t(`${CM}.promptContentMaxLength`);
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await createPrompt({
        prompt_title: title.trim(),
        prompt_content: content.trim(),
        prompt_type: promptType,
        public_available: publicAvailable,
        is_template: isTemplate,
        language,
      });
      toast.success(t(`${PS}.toast.createSuccess`));
      onCreated();
      handleClose();
    } catch {
      toast.error(t(`${PS}.toast.createError`));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setLanguage('ko');
    setPromptType('user');
    setPublicAvailable(false);
    setIsTemplate(false);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t(`${CM}.title`)}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            {t(`${CM}.cancel`)}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {submitting ? t(`${CM}.submitting`) : t(`${CM}.submit`)}
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
              {t(`${CM}.promptTitle`)}
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={t(`${CM}.promptTitlePlaceholder`)}
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
              {t(`${CM}.promptContent`)}
            </label>
            <textarea
              className="min-h-[200px] flex-1 resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={t(`${CM}.promptContentPlaceholder`)}
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
          {/* Language toggle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t(`${CM}.language`)}
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
                {t(`${CM}.korean`)}
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
                {t(`${CM}.english`)}
              </button>
            </div>
          </div>

          {/* Prompt type toggle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t(`${CM}.promptType`)}
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
                {t(`${CM}.userPrompt`)}
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
                {t(`${CM}.systemPrompt`)}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {promptType === 'system'
                ? t(`${CM}.systemPromptDescription`)
                : t(`${CM}.userPromptDescription`)}
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
                {t(`${CM}.setAsPublic`)}
              </span>
              <p className="text-xs text-muted-foreground">
                {t(`${CM}.publicDescription`)}
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
                {t(`${CM}.setAsTemplate`)}
              </span>
              <p className="text-xs text-muted-foreground">
                {t(`${CM}.templateDescription`)}
              </p>
            </div>
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default PromptCreateModal;
