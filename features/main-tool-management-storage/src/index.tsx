'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { CardBadge, ToolTabPlugin, ToolTabPluginProps } from '@xgen/types';
import { Button, EmptyState, ResourceCardGrid, FilterTabs, Modal, Label, Textarea, useToast } from '@xgen/ui';
import { FiPlay, FiEdit2, FiCopy, FiTrash2, FiSettings, FiDownload, FiUser, FiClock, FiCheckSquare, FiRefreshCw, FiTool, FiPlus, FiFile, FiClipboard } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listToolsDetail, deleteTool, testTool, saveTool } from './api';
import type { ToolDetail, ToolSaveData } from './api';
import { ToolStorageUpload } from './tool-upload';
import './locales';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'inactive' | 'archived';
type OwnerFilter = 'all' | 'personal' | 'shared';
type ViewMode = 'storage' | 'upload' | 'edit';

const STATUS_BADGE_VARIANT: Record<string, CardBadge['variant']> = {
  active: 'success',
  inactive: 'error',
  draft: 'warning',
  archived: 'secondary',
};

const STATUS_BADGE_KEY: Record<string, string> = {
  active: 'toolManagementStorage.badges.active',
  inactive: 'toolManagementStorage.badges.inactive',
  draft: 'toolManagementStorage.badges.draft',
  archived: 'toolManagementStorage.badges.archived',
};

const DEPLOY_BADGE_VARIANT: Record<string, CardBadge['variant']> = {
  deployed: 'purple',
  pending: 'warning',
  not_deployed: 'error',
};

const DEPLOY_BADGE_KEY: Record<string, string> = {
  deployed: 'toolManagementStorage.badges.deployed',
  pending: 'toolManagementStorage.badges.pending',
  not_deployed: 'toolManagementStorage.badges.notDeployed',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '. ');
}

// ─────────────────────────────────────────────────────────────
// ToolStorage Component
// ─────────────────────────────────────────────────────────────

export interface ToolStorageProps extends ToolTabPluginProps {}

export const ToolStorage: React.FC<ToolStorageProps> = ({ onNavigate, onSubToolbarChange }) => {
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();
  const { toast } = useToast();

  // State
  const [tools, setTools] = useState<ToolDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deployStatus, setDeployStatus] = useState<Record<string, string>>({});
  const [testingToolId, setTestingToolId] = useState<string | null>(null);

  // View mode: storage (list) / upload (create) / edit
  const [viewMode, setViewMode] = useState<ViewMode>('storage');
  const [editingTool, setEditingTool] = useState<ToolDetail | null>(null);
  const [importedToolData, setImportedToolData] = useState<ToolSaveData | null>(null);

  // JSON Import modal
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [jsonInputError, setJsonInputError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load tools
  const fetchTools = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listToolsDetail();
      setTools(data);

      const statusMap: Record<string, string> = {};
      data.forEach((tool) => {
        if (tool.userId === Number(user?.id)) {
          if (tool.inquireDeploy) {
            statusMap[tool.name] = 'pending';
          } else if (tool.isDeployed) {
            statusMap[tool.name] = 'deployed';
          } else {
            statusMap[tool.name] = 'not_deployed';
          }
        }
      });
      setDeployStatus(statusMap);
    } catch (err) {
      console.error('Failed to fetch tools:', err);
      setError(t('toolManagementStorage.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, user?.id, t]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const isOwner = useCallback(
    (userId?: number): boolean => {
      if (!isInitialized || !user) return false;
      if (userId === undefined || userId === null) return false;
      return Number(user.id) === Number(userId);
    },
    [isInitialized, user],
  );

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      if (statusFilter === 'all') {
        if (tool.status === 'inactive') return false;
      } else if (tool.status !== statusFilter) {
        return false;
      }
      if (ownerFilter === 'personal' && tool.isShared) return false;
      if (ownerFilter === 'shared' && !tool.isShared) return false;
      return true;
    });
  }, [tools, statusFilter, ownerFilter]);

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────

  // 1. Test saved tool
  const handleTest = useCallback(
    async (tool: ToolDetail) => {
      setTestingToolId(tool.id);
      try {
        const result = await testTool(tool.keyValue, tool.id);
        if (result.success) {
          toast.success(t('toolManagementStorage.messages.testSuccess'));
        } else {
          toast.error(t('toolManagementStorage.messages.testFailed'));
        }
        await fetchTools();
      } catch (err) {
        console.error('Failed to test tool:', err);
        toast.error(t('toolManagementStorage.messages.testFailed'));
      } finally {
        setTestingToolId(null);
      }
    },
    [fetchTools, t, toast],
  );

  // 2. Edit tool
  const handleEdit = useCallback((tool: ToolDetail) => {
    setEditingTool(tool);
    setViewMode('edit');
  }, []);

  // 3. Copy/duplicate tool
  const handleCopy = useCallback(
    async (tool: ToolDetail) => {
      try {
        const copyData: ToolSaveData = {
          function_name: `${tool.name}_copy`,
          function_id: '',
          description: tool.description,
          api_url: tool.apiUrl,
          api_method: tool.apiMethod,
          api_timeout: tool.apiTimeout,
          body_type: tool.bodyType || 'application/json',
          is_query_string: tool.isQueryString || false,
          response_filter: tool.responseFilter,
          html_parser: tool.htmlParser || false,
          response_filter_path: tool.responseFilterPath,
          response_filter_field: tool.responseFilterField,
          api_header: (typeof tool.apiHeader === 'object' && tool.apiHeader !== null ? tool.apiHeader : {}) as Record<string, string>,
          api_body: tool.apiBody || {},
          static_body: (typeof tool.staticBody === 'object' && tool.staticBody !== null ? tool.staticBody : {}) as Record<string, string>,
          metadata: tool.metadata || {},
          status: 'active',
        };
        await saveTool(copyData.function_name, copyData);
        toast.success(t('toolManagementStorage.messages.copySuccess', { name: tool.name }));
        await fetchTools();
      } catch (err) {
        console.error('Failed to copy tool:', err);
        toast.error(t('toolManagementStorage.messages.copyFailed'));
      }
    },
    [fetchTools, t, toast],
  );

  // 4. JSON Download
  const handleDownload = useCallback(
    (tool: ToolDetail) => {
      const toolExport = {
        _format: 'plateerag_tool_v1',
        _exportedAt: new Date().toISOString(),
        function_name: tool.name,
        function_id: tool.id,
        description: tool.description,
        api_url: tool.apiUrl,
        api_method: tool.apiMethod,
        api_timeout: tool.apiTimeout,
        body_type: tool.bodyType || 'application/json',
        is_query_string: tool.isQueryString || false,
        response_filter: tool.responseFilter,
        html_parser: tool.htmlParser || false,
        response_filter_path: tool.responseFilterPath,
        response_filter_field: tool.responseFilterField,
        api_header: tool.apiHeader || {},
        api_body: tool.apiBody || {},
        static_body: tool.staticBody || {},
        metadata: tool.metadata || {},
      };

      const jsonString = JSON.stringify(toolExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tool.name || 'tool'}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('toolManagementStorage.messages.downloadSuccess', { name: tool.name }));
    },
    [t, toast],
  );

  // 5. Settings — open in edit mode
  const handleSettings = useCallback((tool: ToolDetail) => {
    setEditingTool(tool);
    setViewMode('edit');
  }, []);

  // 6. Delete with Toast confirm
  const handleDelete = useCallback(
    async (tool: ToolDetail) => {
      const ok = await toast.confirm({
        title: t('toolManagementStorage.confirm.deleteTitle'),
        message: t('toolManagementStorage.confirm.delete', { name: tool.name }),
        variant: 'danger',
        confirmText: t('toolManagementStorage.confirm.confirmDelete'),
        cancelText: t('toolManagementStorage.confirm.cancel'),
      });
      if (!ok) return;

      try {
        await deleteTool(tool.id);
        toast.success(t('toolManagementStorage.messages.deleteSuccess', { name: tool.name }));
        await fetchTools();
      } catch (err) {
        console.error('Failed to delete tool:', err);
        toast.error(t('toolManagementStorage.messages.deleteFailed', { name: tool.name }));
      }
    },
    [fetchTools, t, toast],
  );

  // Multi-select
  const handleToggleMultiSelect = useCallback(() => {
    setIsMultiSelectMode((prev) => {
      if (prev) setSelectedIds([]);
      return !prev;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const toDelete = tools.filter(
      (tool) => selectedIds.includes(tool.id) && isOwner(tool.userId),
    );

    if (toDelete.length === 0) {
      toast.error(t('toolManagementStorage.error.noDeletePermission'));
      return;
    }

    const ok = await toast.confirm({
      title: t('toolManagementStorage.confirm.deleteTitle'),
      message: t('toolManagementStorage.confirm.bulkDelete', { count: toDelete.length }),
      variant: 'danger',
      confirmText: t('toolManagementStorage.confirm.confirmDelete'),
      cancelText: t('toolManagementStorage.confirm.cancel'),
    });
    if (!ok) return;

    try {
      for (const tool of toDelete) {
        await deleteTool(tool.id);
      }
      toast.success(t('toolManagementStorage.messages.bulkDeleteSuccess', { count: toDelete.length }));
      setSelectedIds([]);
      setIsMultiSelectMode(false);
      await fetchTools();
    } catch (err) {
      console.error('Failed to bulk delete:', err);
      toast.error(t('toolManagementStorage.messages.bulkDeleteFailed'));
    }
  }, [selectedIds, tools, isOwner, fetchTools, t, toast]);

  // Create new tool
  const handleCreateNew = useCallback(() => {
    setImportedToolData(null);
    setEditingTool(null);
    setViewMode('upload');
  }, []);

  // Back to storage from upload/edit
  const handleBackToStorage = useCallback(() => {
    setViewMode('storage');
    setEditingTool(null);
    setImportedToolData(null);
    fetchTools();
  }, [fetchTools]);

  // ─────────────────────────────────────────────────────────────
  // Import: From File
  // ─────────────────────────────────────────────────────────────

  const handleImportFromFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.json')) {
        toast.error(t('toolManagementStorage.messages.jsonFileOnly'));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsedData = JSON.parse(content);

          if (parsedData._format !== 'plateerag_tool_v1') {
            toast.error(t('toolManagementStorage.messages.invalidFormat'));
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }

          if (!parsedData.function_name || !parsedData.api_url) {
            toast.error(t('toolManagementStorage.messages.missingFields'));
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }

          const importData = {
            ...parsedData,
            function_id: '',
            function_name: parsedData.function_name + '_imported',
          };
          delete importData._format;
          delete importData._exportedAt;

          setImportedToolData(importData as ToolSaveData);
          setViewMode('upload');
          toast.success(t('toolManagementStorage.messages.importSuccess'));
        } catch {
          toast.error(t('toolManagementStorage.messages.jsonParseError'));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.onerror = () => {
        toast.error(t('toolManagementStorage.messages.fileReadError'));
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
    },
    [t, toast],
  );

  // ─────────────────────────────────────────────────────────────
  // Import: From JSON Text
  // ─────────────────────────────────────────────────────────────

  const handleOpenJsonModal = useCallback(() => {
    setJsonInputText('');
    setJsonInputError(null);
    setIsJsonModalOpen(true);
  }, []);

  const handleJsonSubmit = useCallback(() => {
    if (!jsonInputText.trim()) {
      setJsonInputError(t('toolManagementStorage.messages.jsonRequired'));
      return;
    }
    try {
      const parsedData = JSON.parse(jsonInputText);
      if (parsedData._format !== 'plateerag_tool_v1') {
        setJsonInputError(t('toolManagementStorage.messages.invalidFormat'));
        return;
      }
      if (!parsedData.function_name || !parsedData.api_url) {
        setJsonInputError(t('toolManagementStorage.messages.missingFields'));
        return;
      }

      const importData = {
        ...parsedData,
        function_id: '',
        function_name: parsedData.function_name + '_imported',
      };
      delete importData._format;
      delete importData._exportedAt;

      setImportedToolData(importData as ToolSaveData);
      setIsJsonModalOpen(false);
      setViewMode('upload');
      toast.success(t('toolManagementStorage.messages.importSuccess'));
    } catch {
      setJsonInputError(t('toolManagementStorage.messages.jsonParseError'));
    }
  }, [jsonInputText, t, toast]);

  // Filter tabs
  const statusTabs = useMemo(
    () => [
      { key: 'all', label: t('toolManagementStorage.filter.all') },
      { key: 'active', label: t('toolManagementStorage.filter.active') },
      { key: 'inactive', label: t('toolManagementStorage.filter.inactive') },
      { key: 'archived', label: t('toolManagementStorage.filter.archived') },
    ],
    [t],
  );

  const ownerTabs = useMemo(
    () => [
      { key: 'all', label: t('toolManagementStorage.owner.all') },
      { key: 'personal', label: t('toolManagementStorage.owner.personal') },
      { key: 'shared', label: t('toolManagementStorage.owner.shared') },
    ],
    [t],
  );

  // Build card items
  const cardItems = useMemo(() => {
    return filteredTools.map((tool) => {
      const badges: CardBadge[] = [];

      const statusVariant = STATUS_BADGE_VARIANT[tool.status];
      const statusKey = STATUS_BADGE_KEY[tool.status];
      if (statusVariant && statusKey) {
        badges.push({ text: t(statusKey), variant: statusVariant });
      }

      badges.push({
        text: tool.isShared ? t('toolManagementStorage.badges.shared') : t('toolManagementStorage.badges.my'),
        variant: tool.isShared ? 'primary' : 'secondary',
      });

      if (isOwner(tool.userId)) {
        const deployKey = deployStatus[tool.name] || 'not_deployed';
        const deployVariant = DEPLOY_BADGE_VARIANT[deployKey];
        const deployI18nKey = DEPLOY_BADGE_KEY[deployKey];
        if (deployVariant && deployI18nKey) {
          badges.push({ text: t(deployI18nKey), variant: deployVariant });
        }
      }

      const isTesting = testingToolId === tool.id;

      const primaryActions = tool.status !== 'inactive'
        ? [
            {
              id: 'test',
              icon: <FiPlay className={isTesting ? 'animate-pulse' : ''} />,
              label: t('toolManagementStorage.actions.test'),
              onClick: () => handleTest(tool),
              disabled: isTesting,
            },
            {
              id: 'edit',
              icon: <FiEdit2 />,
              label: t('toolManagementStorage.actions.edit'),
              onClick: () => handleEdit(tool),
              disabled: !isOwner(tool.userId) && tool.sharePermissions !== 'read_write',
            },
            {
              id: 'copy',
              icon: <FiCopy />,
              label: t('toolManagementStorage.actions.copy'),
              onClick: () => handleCopy(tool),
            },
          ]
        : [];

      const dropdownActions = isOwner(tool.userId)
        ? [
            { id: 'download', icon: <FiDownload />, label: t('toolManagementStorage.actions.download'), onClick: () => handleDownload(tool) },
            { id: 'settings', icon: <FiSettings />, label: t('toolManagementStorage.actions.settings'), onClick: () => handleSettings(tool) },
            { id: 'delete', icon: <FiTrash2 />, label: t('toolManagementStorage.actions.delete'), onClick: () => handleDelete(tool), danger: true, dividerBefore: true },
          ]
        : [
            { id: 'download', icon: <FiDownload />, label: t('toolManagementStorage.actions.download'), onClick: () => handleDownload(tool) },
          ];

      return {
        id: tool.id,
        data: tool,
        title: tool.name,
        description: tool.description,
        thumbnail: {
          icon: <FiTool />,
          backgroundColor: 'rgba(48, 94, 235, 0.1)',
          iconColor: '#305eeb',
        },
        badges,
        metadata: [
          { icon: <FiUser />, value: tool.author },
          ...(tool.lastModified
            ? [{ icon: <FiClock />, value: formatDate(tool.lastModified) }]
            : []),
          ...(tool.apiMethod
            ? [{ value: `${tool.apiMethod}` }]
            : []),
          ...(tool.parameterCount > 0
            ? [{ value: t('toolManagementStorage.card.params', { count: tool.parameterCount }) }]
            : []),
        ],
        primaryActions,
        dropdownActions,
        inactive: tool.status === 'inactive',
      };
    });
  }, [filteredTools, isOwner, deployStatus, testingToolId, handleTest, handleEdit, handleCopy, handleDownload, handleSettings, handleDelete, t]);

  // Push subToolbar content to orchestrator — only show when in storage view
  useEffect(() => {
    if (viewMode !== 'storage') {
      onSubToolbarChange?.(null);
      return;
    }

    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <FilterTabs
            tabs={statusTabs}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as StatusFilter)}
            variant="underline"
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterTabs
            tabs={ownerTabs}
            activeKey={ownerFilter}
            onChange={(key) => setOwnerFilter(key as OwnerFilter)}
            variant="underline"
          />

          <Button
            variant={isMultiSelectMode ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleMultiSelect}
            title={isMultiSelectMode ? t('toolManagementStorage.buttons.multiSelectDisable') : t('toolManagementStorage.buttons.multiSelectEnable')}
          >
            <FiCheckSquare />
          </Button>

          {isMultiSelectMode && selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <FiTrash2 />
              {t('toolManagementStorage.buttons.deleteSelected')}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTools}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>,
    );
  }, [viewMode, onSubToolbarChange, statusTabs, ownerTabs, statusFilter, ownerFilter, isMultiSelectMode, selectedIds, loading, handleToggleMultiSelect, handleBulkDelete, fetchTools, t]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  // ─────────────────────────────────────────────────────────────
  // Render: Upload/Edit mode
  // ─────────────────────────────────────────────────────────────

  if (viewMode === 'upload' || viewMode === 'edit') {
    return (
      <ToolStorageUpload
        onBack={handleBackToStorage}
        editMode={viewMode === 'edit'}
        initialData={editingTool}
        importedData={importedToolData}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render: Storage list
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      {/* Top action bar */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handleImportFromFile}>
          <FiFile />
          {t('toolManagementStorage.buttons.importFile')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleOpenJsonModal}>
          <FiClipboard />
          {t('toolManagementStorage.buttons.importJson')}
        </Button>
        <Button onClick={handleCreateNew}>
          <FiPlus />
          {t('toolManagementStorage.buttons.createNew')}
        </Button>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Tool list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            <p>{t('toolManagementStorage.messages.loadingAuth')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiTool />}
            title={t('toolManagementStorage.error.title')}
            description={error}
            action={{
              label: t('toolManagementStorage.buttons.retry'),
              onClick: fetchTools,
            }}
          />
        ) : (
          <ResourceCardGrid
            items={cardItems}
            loading={loading}
            showEmptyState
            emptyStateProps={{
              icon: <FiTool />,
              title: t('toolManagementStorage.empty.title'),
              description: t('toolManagementStorage.empty.description'),
              action: {
                label: t('toolManagementStorage.empty.action'),
                onClick: handleCreateNew,
              },
            }}
            multiSelectMode={isMultiSelectMode}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </div>

      {/* JSON Import Modal */}
      <Modal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        title={t('toolManagementStorage.import.jsonModalTitle')}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsJsonModalOpen(false)}>
              {t('toolManagementStorage.confirm.cancel')}
            </Button>
            <Button onClick={handleJsonSubmit}>
              {t('toolManagementStorage.import.importButton')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Label>{t('toolManagementStorage.import.jsonLabel')}</Label>
          <Textarea
            value={jsonInputText}
            onChange={(e) => {
              setJsonInputText(e.target.value);
              setJsonInputError(null);
            }}
            placeholder={t('toolManagementStorage.import.jsonPlaceholder')}
            rows={12}
            className="font-mono text-sm"
          />
          {jsonInputError && (
            <p className="text-sm text-error">{jsonInputError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('toolManagementStorage.import.jsonHint')}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ToolStorage;

export const toolStoragePlugin: ToolTabPlugin = {
  id: 'storage',
  name: 'Tool Storage',
  tabLabelKey: 'toolStorage.tabs.storage',
  order: 1,
  component: ToolStorage,
};
