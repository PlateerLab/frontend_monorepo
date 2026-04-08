'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiDownload, FiX } from '@xgen/icons';
import { downloadChatLogsExcel } from '../api/chat-log-api';

export const DownloadDropdown: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [workflowId, setAgentflowId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dataProcessing, setDataProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const blob = await downloadChatLogsExcel(
        userId || undefined,
        workflowId || undefined,
        startDate || undefined,
        endDate || undefined,
        dataProcessing,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chat-logs.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch {
      toast.error(t('admin.agentflowManagement.chatMonitoring.loadError'));
    } finally {
      setDownloading(false);
    }
  }, [userId, workflowId, startDate, endDate, dataProcessing, toast, t]);

  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';
  const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<FiDownload className="h-4 w-4" />}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {t('admin.agentflowManagement.chatMonitoring.excelDownload')}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {t('admin.agentflowManagement.chatMonitoring.excelDownloadOptions')}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>
                {t('admin.agentflowManagement.chatMonitoring.userIdOptional')}
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder={t('admin.agentflowManagement.chatMonitoring.searchAllPlaceholder')}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t('admin.agentflowManagement.chatMonitoring.workflowIdOptional')}
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder={t('admin.agentflowManagement.chatMonitoring.searchAllPlaceholder')}
                value={workflowId}
                onChange={(e) => setAgentflowId(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t('admin.agentflowManagement.chatMonitoring.startDateOptional')}
              </label>
              <input
                type="date"
                className={inputClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t('admin.agentflowManagement.chatMonitoring.endDateOptional')}
              </label>
              <input
                type="date"
                className={inputClass}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={dataProcessing}
                onChange={(e) => setDataProcessing(e.target.checked)}
                className="rounded border-border"
              />
              {t('admin.agentflowManagement.chatMonitoring.applyDataProcessing')}
            </label>

            <Button
              variant="primary"
              size="sm"
              fullWidth
              loading={downloading}
              leftIcon={<FiDownload className="h-4 w-4" />}
              onClick={handleDownload}
            >
              {downloading
                ? t('admin.agentflowManagement.chatMonitoring.downloading')
                : t('admin.agentflowManagement.chatMonitoring.startDownload')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadDropdown;
