'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiDownload, FiX } from '@xgen/icons';
import { downloadAllPrompts } from '../api/prompt-api';

const PS = 'admin.agentflowManagement.promptStore';
const DL = `${PS}.download`;

interface DownloadDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

const DownloadDropdown: React.FC<DownloadDropdownProps> = ({
  isOpen,
  onToggle,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [format, setFormat] = useState<'excel' | 'csv'>('excel');
  const [userId, setUserId] = useState('');
  const [language, setLanguage] = useState('');
  const [publicAvailable, setPublicAvailable] = useState('');
  const [isTemplate, setIsTemplate] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Outside click detection
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onToggle();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const handleDownload = async () => {
    if (userId && !/^\d+$/.test(userId.trim())) {
      toast.error(t(`${PS}.toast.invalidUserId`));
      return;
    }

    try {
      setDownloading(true);
      const blob = await downloadAllPrompts({
        format,
        user_id: userId.trim() || undefined,
        language: language || undefined,
        public_available: publicAvailable || undefined,
        is_template: isTemplate || undefined,
      });

      const extension = format === 'excel' ? 'xlsx' : 'csv';
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prompts.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      onToggle();
    } catch {
      toast.error(t(`${PS}.toast.downloadError`));
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card p-4 shadow-lg"
    >
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          {t(`${DL}.title`)}
        </h4>
        <button
          type="button"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onToggle}
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Format */}
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            {t(`${DL}.format`)}
          </label>
          <select
            className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={format}
            onChange={(e) => setFormat(e.target.value as 'excel' | 'csv')}
          >
            <option value="excel">{t(`${DL}.excelFormat`)}</option>
            <option value="csv">{t(`${DL}.csvFormat`)}</option>
          </select>
        </div>

        {/* User ID */}
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            {t(`${DL}.userId`)}
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t(`${DL}.userIdPlaceholder`)}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {t(`${DL}.userIdHelp`)}
          </p>
        </div>

        {/* Language */}
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            {t(`${DL}.language`)}
          </label>
          <select
            className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="">{t(`${DL}.allLanguages`)}</option>
            <option value="ko">{t(`${PS}.languageFilter.ko`)}</option>
            <option value="en">{t(`${PS}.languageFilter.en`)}</option>
          </select>
        </div>

        {/* Public Available */}
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            {t(`${DL}.publicAvailable`)}
          </label>
          <select
            className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={publicAvailable}
            onChange={(e) => setPublicAvailable(e.target.value)}
          >
            <option value="">{t(`${DL}.allPublic`)}</option>
            <option value="true">{t(`${DL}.public`)}</option>
            <option value="false">{t(`${DL}.private`)}</option>
          </select>
        </div>

        {/* Is Template */}
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            {t(`${DL}.isTemplate`)}
          </label>
          <select
            className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={isTemplate}
            onChange={(e) => setIsTemplate(e.target.value)}
          >
            <option value="">{t(`${DL}.allTemplate`)}</option>
            <option value="true">{t(`${DL}.template`)}</option>
            <option value="false">{t(`${DL}.normal`)}</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onToggle} disabled={downloading}>
          {t(`${DL}.cancel`)}
        </Button>
        <Button variant="primary" size="sm" onClick={handleDownload} loading={downloading}>
          <FiDownload className="mr-1 h-3.5 w-3.5" />
          {downloading ? t(`${DL}.downloading`) : t(`${DL}.download`)}
        </Button>
      </div>
    </div>
  );
};

export default DownloadDropdown;
