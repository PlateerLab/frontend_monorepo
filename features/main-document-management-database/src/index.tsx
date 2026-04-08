'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps, CardBadge } from '@xgen/types';
import { Button, FilterTabs, SearchInput, Modal, Input, Label, Switch, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, ResourceCardGrid, useToast } from '@xgen/ui';
import { FiDatabase, FiClock, FiTrash2, FiEdit2, FiShare2, FiFileText, FiUser, FiUsers } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import {
  listDBConnections, createDBConnection, updateDBConnection, deleteDBConnection,
  testSavedDBConnection, shareDBConnection, toggleDBConnectionActive,
  type DBConnectionItem,
} from './api';
import { DbDocumentation } from '@xgen/main-document-management-db-documentation';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────

type OwnerFilter = 'all' | 'personal' | 'shared';
type SubTab = 'connections' | 'documentation';

const DB_TYPE_PORTS: Record<string, string> = {
  postgresql: '5432',
  oracle: '1521',
  informix: '9089',
};

const PlusIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch { return dateStr; }
}

// ─────────────────────────────────────────────────────────────
// DocumentDatabase Component
// ─────────────────────────────────────────────────────────────

export interface DocumentDatabaseProps extends DocumentTabPluginProps {}

export const DocumentDatabase: React.FC<DocumentDatabaseProps> = ({ onSubToolbarChange, onToolbarExtraChange }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── Sub-tab State ──
  const [subTab, setSubTab] = useState<SubTab>('connections');
  const [docPreselectedConnectionId, setDocPreselectedConnectionId] = useState<number | undefined>();

  // ── List State ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [dbConnections, setDbConnections] = useState<DBConnectionItem[]>([]);
  const [testingId, setTestingId] = useState<number | null>(null);

  // ── Create Modal State ──
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDbType, setFormDbType] = useState('postgresql');
  const [formHost, setFormHost] = useState('');
  const [formPort, setFormPort] = useState('5432');
  const [formDatabase, setFormDatabase] = useState('');
  const [formSchema, setFormSchema] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCustomPassword, setFormCustomPassword] = useState('');
  const [formSsl, setFormSsl] = useState(false);
  const [formReadOnly, setFormReadOnly] = useState(true);
  const [formConnectionTimeout, setFormConnectionTimeout] = useState('30');
  const [formQueryTimeout, setFormQueryTimeout] = useState('300');
  const [formPoolSize, setFormPoolSize] = useState('5');
  const [formMaxOverflow, setFormMaxOverflow] = useState('10');
  const [formMaxRowsLimit, setFormMaxRowsLimit] = useState('10000');
  const [formAllowedTables, setFormAllowedTables] = useState('');
  const [formDeniedTables, setFormDeniedTables] = useState('');

  // ── Edit Modal State ──
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DBConnectionItem | null>(null);
  const [updating, setUpdating] = useState(false);

  // ── Share Modal State ──
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingConnection, setSharingConnection] = useState<DBConnectionItem | null>(null);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [savingShare, setSavingShare] = useState(false);

  // ── Data Loading ──
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDBConnections();
      setDbConnections(data);
    } catch (err) {
      console.error('Failed to load DB connections:', err);
      setError(t('documents.database.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── DB Type → Port ──
  const handleDbTypeChange = useCallback((type: string) => {
    setFormDbType(type);
    setFormPort(DB_TYPE_PORTS[type] || '5432');
  }, []);

  // ── Reset Form ──
  const resetForm = useCallback(() => {
    setFormName(''); setFormDesc(''); setFormDbType('postgresql');
    setFormHost(''); setFormPort('5432'); setFormDatabase('');
    setFormSchema(''); setFormUsername(''); setFormPassword('');
    setFormCustomPassword(''); setFormSsl(false); setFormReadOnly(true);
    setFormConnectionTimeout('30'); setFormQueryTimeout('300');
    setFormPoolSize('5'); setFormMaxOverflow('10');
    setFormMaxRowsLimit('10000'); setFormAllowedTables(''); setFormDeniedTables('');
  }, []);

  // ── Populate Form from Connection ──
  const populateForm = useCallback((db: DBConnectionItem) => {
    setFormName(db.connectionName);
    setFormDesc(db.description);
    setFormDbType(db.dbType);
    setFormHost(db.host);
    setFormPort(String(db.port));
    setFormDatabase(db.databaseName);
    setFormSchema(db.dbSchema);
    setFormUsername(db.dbUsername);
    setFormPassword('');
    setFormCustomPassword('');
    setFormSsl(db.useSsl);
    setFormReadOnly(db.readOnly);
    setFormConnectionTimeout(String(db.connectionTimeout));
    setFormQueryTimeout(String(db.queryTimeout));
    setFormPoolSize(String(db.poolSize));
    setFormMaxOverflow(String(db.maxOverflow));
    setFormMaxRowsLimit(String(db.maxRowsLimit));
    setFormAllowedTables(db.allowedTables);
    setFormDeniedTables(db.deniedTables);
  }, []);

  // ── Create ──
  const handleCreate = useCallback(async () => {
    if (!formName.trim() || !formHost.trim() || !formDatabase.trim()) return;
    setCreating(true);
    try {
      await createDBConnection({
        connection_name: formName.trim(),
        description: formDesc.trim() || undefined,
        db_type: formDbType,
        db_host: formHost.trim(),
        db_port: parseInt(formPort, 10) || 5432,
        db_name: formDatabase.trim(),
        db_schema: formSchema.trim() || undefined,
        db_username: formUsername.trim() || undefined,
        db_password: formPassword || undefined,
        custom_password: formCustomPassword || undefined,
        use_ssl: formSsl,
        read_only: formReadOnly,
        connection_timeout: parseInt(formConnectionTimeout, 10) || 30,
        query_timeout: parseInt(formQueryTimeout, 10) || 300,
        pool_size: parseInt(formPoolSize, 10) || 5,
        max_overflow: parseInt(formMaxOverflow, 10) || 10,
        max_rows_limit: parseInt(formMaxRowsLimit, 10) || 10000,
        allowed_tables: formAllowedTables.trim() || undefined,
        denied_tables: formDeniedTables.trim() || undefined,
      });
      setIsCreateModalOpen(false);
      resetForm();
      toast.success(t('documents.database.toast.createSuccess'));
      await loadData();
    } catch (err) {
      console.error('Failed to create DB connection:', err);
      toast.error(t('documents.database.toast.createFailed'));
    } finally {
      setCreating(false);
    }
  }, [formName, formDesc, formDbType, formHost, formPort, formDatabase, formSchema, formUsername, formPassword, formCustomPassword, formSsl, formReadOnly, formConnectionTimeout, formQueryTimeout, formPoolSize, formMaxOverflow, formMaxRowsLimit, formAllowedTables, formDeniedTables, resetForm, loadData, toast, t]);

  // ── Edit ──
  const handleOpenEdit = useCallback((db: DBConnectionItem) => {
    setEditingConnection(db);
    populateForm(db);
    setIsEditModalOpen(true);
  }, [populateForm]);

  const handleUpdate = useCallback(async () => {
    if (!editingConnection || !formName.trim() || !formHost.trim() || !formDatabase.trim()) return;
    setUpdating(true);
    try {
      const data: Record<string, unknown> = {
        connection_name: formName.trim(),
        description: formDesc.trim(),
        db_type: formDbType,
        db_host: formHost.trim(),
        db_port: parseInt(formPort, 10) || 5432,
        db_name: formDatabase.trim(),
        db_schema: formSchema.trim(),
        db_username: formUsername.trim(),
        use_ssl: formSsl,
        read_only: formReadOnly,
        connection_timeout: parseInt(formConnectionTimeout, 10) || 30,
        query_timeout: parseInt(formQueryTimeout, 10) || 300,
        pool_size: parseInt(formPoolSize, 10) || 5,
        max_overflow: parseInt(formMaxOverflow, 10) || 10,
        max_rows_limit: parseInt(formMaxRowsLimit, 10) || 10000,
        allowed_tables: formAllowedTables.trim(),
        denied_tables: formDeniedTables.trim(),
      };
      if (formPassword) data.db_password = formPassword;
      if (formCustomPassword) data.custom_password = formCustomPassword;
      await updateDBConnection(editingConnection.numericId, data);
      setIsEditModalOpen(false);
      setEditingConnection(null);
      resetForm();
      toast.success(t('documents.database.toast.updateSuccess'));
      await loadData();
    } catch (err) {
      console.error('Failed to update DB connection:', err);
      toast.error(t('documents.database.toast.updateFailed'));
    } finally {
      setUpdating(false);
    }
  }, [editingConnection, formName, formDesc, formDbType, formHost, formPort, formDatabase, formSchema, formUsername, formPassword, formCustomPassword, formSsl, formReadOnly, formConnectionTimeout, formQueryTimeout, formPoolSize, formMaxOverflow, formMaxRowsLimit, formAllowedTables, formDeniedTables, resetForm, loadData, toast, t]);

  // ── Delete ──
  const handleDelete = useCallback(async (db: DBConnectionItem) => {
    try {
      await deleteDBConnection(db.numericId);
      toast.success(t('documents.database.toast.deleteSuccess'));
      await loadData();
    } catch (err) {
      console.error('Failed to delete DB connection:', err);
      toast.error(t('documents.database.toast.deleteFailed'));
    }
  }, [loadData, toast, t]);

  // ── Toggle Active ──
  const handleToggleActive = useCallback(async (db: DBConnectionItem) => {
    try {
      await toggleDBConnectionActive(db.numericId, !db.isActive);
      toast.success(db.isActive ? t('documents.database.toast.deactivated') : t('documents.database.toast.activated'));
      await loadData();
    } catch (err) {
      console.error('Failed to toggle active:', err);
      toast.error(t('documents.database.toast.toggleFailed'));
    }
  }, [loadData, toast, t]);

  // ── Connection Test ──
  const handleTestConnection = useCallback(async (db: DBConnectionItem) => {
    setTestingId(db.numericId);
    try {
      const result = await testSavedDBConnection(db.numericId);
      if (result.success) {
        toast.success(t('documents.database.toast.testSuccess'));
      } else {
        toast.error(t('documents.database.toast.testFailed', { message: result.message || '' }));
      }
      await loadData();
    } catch (err) {
      console.error('Connection test failed:', err);
      toast.error(t('documents.database.toast.testFailed', { message: '' }));
    } finally {
      setTestingId(null);
    }
  }, [loadData, toast, t]);

  // ── Share ──
  const handleOpenShare = useCallback((db: DBConnectionItem) => {
    setSharingConnection(db);
    setShareEnabled(db.isShared);
    setIsShareModalOpen(true);
  }, []);

  const handleSaveShare = useCallback(async () => {
    if (!sharingConnection) return;
    setSavingShare(true);
    try {
      await shareDBConnection(sharingConnection.numericId, {
        is_shared: shareEnabled,
        share_permissions: 'read',
      });
      setIsShareModalOpen(false);
      setSharingConnection(null);
      toast.success(shareEnabled
        ? t('documents.database.toast.shareEnabled', { name: sharingConnection.connectionName })
        : t('documents.database.toast.shareDisabled', { name: sharingConnection.connectionName })
      );
      await loadData();
    } catch (err) {
      console.error('Failed to update share:', err);
      toast.error(t('documents.database.toast.shareFailed'));
    } finally {
      setSavingShare(false);
    }
  }, [sharingConnection, shareEnabled, loadData, toast, t]);

  // ── Close Modals ──
  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    resetForm();
  }, [resetForm]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingConnection(null);
    resetForm();
  }, [resetForm]);

  // ── Filters ──
  const ownerFilterTabs = useMemo(() => [
    { key: 'all', label: t('documents.database.filters.all') },
    { key: 'personal', label: t('documents.database.filters.personal') },
    { key: 'shared', label: t('documents.database.filters.shared') },
  ], [t]);

  const filteredDbConnections = useMemo(() => {
    return dbConnections.filter(db => {
      if (search && !db.connectionName.toLowerCase().includes(search.toLowerCase())) return false;
      if (ownerFilter === 'personal' && db.isShared) return false;
      if (ownerFilter === 'shared' && !db.isShared) return false;
      return true;
    });
  }, [dbConnections, search, ownerFilter]);

  // ── Card Items ──
  const cardItems = useMemo(() => {
    return filteredDbConnections.map((db) => {
      const badges: CardBadge[] = [];

      // Activity badge
      badges.push({
        text: db.isActive ? t('documents.database.badges.active') : t('documents.database.badges.inactive'),
        variant: db.isActive ? 'primary' : 'secondary',
      });

      // Connection status badge
      if (db.lastConnectionStatus === 'success') {
        badges.push({ text: t('documents.database.badges.success'), variant: 'success' });
      } else if (db.lastConnectionStatus === 'failed') {
        badges.push({ text: t('documents.database.badges.failed'), variant: 'error' });
      }

      // Sharing badge
      if (db.isShared) {
        badges.push({ text: t('documents.database.filters.shared'), variant: 'purple' });
      }

      return {
        id: db.id,
        data: db,
        title: db.connectionName,
        description: db.description || undefined,
        thumbnail: {
          icon: <FiDatabase />,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          iconColor: '#8b5cf6',
        },
        badges,
        metadata: [
          { icon: <FiDatabase />, value: `${db.dbType.toUpperCase()} · ${db.host}:${db.port}/${db.databaseName}` },
          { icon: <FiUser />, value: db.ownerFullName || db.ownerUsername },
          ...(db.updatedAt ? [{ icon: <FiClock />, value: formatDate(db.updatedAt) }] : []),
          ...(db.isShared && db.shareRoles && db.shareRoles.length > 0 ? [{ icon: <FiUsers />, value: db.shareRoles.join(', ') }] : []),
        ],
        primaryActions: [
          {
            id: 'test',
            icon: <FiDatabase className={testingId === db.numericId ? 'animate-spin' : ''} />,
            label: t('documents.database.actions.test'),
            onClick: () => handleTestConnection(db),
          },
        ],
        dropdownActions: [
          {
            id: 'edit',
            icon: <FiEdit2 />,
            label: t('documents.database.actions.edit'),
            onClick: () => handleOpenEdit(db),
          },
          {
            id: 'toggle-active',
            icon: db.isActive
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64A9 9 0 0 1 12 21 9 9 0 0 1 5.64 6.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
            label: db.isActive ? t('documents.database.actions.deactivate') : t('documents.database.actions.activate'),
            onClick: () => handleToggleActive(db),
          },
          {
            id: 'share',
            icon: <FiShare2 />,
            label: t('documents.database.actions.share'),
            onClick: () => handleOpenShare(db),
          },
          {
            id: 'documentation',
            icon: <FiFileText />,
            label: t('documents.database.actions.documentation'),
            onClick: () => {
              setDocPreselectedConnectionId(db.numericId);
              setSubTab('documentation');
            },
          },
          {
            id: 'delete',
            icon: <FiTrash2 />,
            label: t('documents.database.actions.delete'),
            danger: true,
            onClick: () => handleDelete(db),
          },
        ],
        onClick: () => handleOpenEdit(db),
      };
    });
  }, [filteredDbConnections, testingId, handleTestConnection, handleOpenEdit, handleToggleActive, handleOpenShare, handleDelete, t]);

  // ── Sub-tab tabs ──
  const subTabItems = useMemo(() => [
    { key: 'connections', label: t('documents.dbDocumentation.subTab.connections') },
    { key: 'documentation', label: t('documents.dbDocumentation.subTab.documentation') },
  ], [t]);

  // ── Toolbar Extra: sub-tabs on the same row as main tabs ──
  useEffect(() => {
    onToolbarExtraChange?.(
      <FilterTabs
        tabs={subTabItems}
        activeKey={subTab}
        onChange={(key: string) => setSubTab(key as SubTab)}
      />
    );
  }, [onToolbarExtraChange, subTabItems, subTab]);

  useEffect(() => {
    return () => { onToolbarExtraChange?.(null); };
  }, [onToolbarExtraChange]);

  // ── SubToolbar: only for connections tab ──
  useEffect(() => {
    if (subTab === 'connections') {
      onSubToolbarChange?.(
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <FilterTabs
            tabs={ownerFilterTabs}
            activeKey={ownerFilter}
            onChange={(key: string) => setOwnerFilter(key as OwnerFilter)}
            variant="underline"
          />
          <div className="flex items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('documents.database.searchPlaceholder')}
              size="sm"
            />
            <Button size="toolbar" onClick={() => setIsCreateModalOpen(true)}>
              <PlusIcon />
              {t('documents.database.buttons.newConnection')}
            </Button>
          </div>
        </div>
      );
    } else {
      onSubToolbarChange?.(null);
    }
  }, [onSubToolbarChange, subTab, ownerFilterTabs, ownerFilter, search, t]);

  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  // ── Connection Form (shared between Create & Edit) ──
  const connectionFormContent = (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="space-y-2">
        <Label>{t('documents.database.form.connectionName')} *</Label>
        <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t('documents.database.form.connectionNamePlaceholder')} />
      </div>
      <div className="space-y-2">
        <Label>{t('documents.database.form.description')}</Label>
        <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder={t('documents.database.form.descriptionPlaceholder')} />
      </div>
      <div className="space-y-2">
        <Label>{t('documents.database.form.customPassword')}</Label>
        <Input type="password" value={formCustomPassword} onChange={(e) => setFormCustomPassword(e.target.value)} placeholder={t('documents.database.form.customPasswordPlaceholder')} />
        <p className="text-xs text-muted-foreground">{t('documents.database.form.customPasswordDesc')}</p>
      </div>

      {/* DB Type & Connection */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">{t('documents.database.form.sectionConnection')}</h4>
        <div className="space-y-2">
          <Label>{t('documents.database.form.dbType')} *</Label>
          <Select value={formDbType} onValueChange={handleDbTypeChange}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
              <SelectItem value="oracle">Oracle</SelectItem>
              <SelectItem value="informix">Informix</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div className="space-y-2">
            <Label>{t('documents.database.form.host')} *</Label>
            <Input value={formHost} onChange={(e) => setFormHost(e.target.value)} placeholder={t('documents.database.form.hostPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('documents.database.form.port')}</Label>
            <Input value={formPort} onChange={(e) => setFormPort(e.target.value)} placeholder={DB_TYPE_PORTS[formDbType]} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('documents.database.form.database')} *</Label>
            <Input value={formDatabase} onChange={(e) => setFormDatabase(e.target.value)} placeholder={t('documents.database.form.databasePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('documents.database.form.schema')}</Label>
            <Input value={formSchema} onChange={(e) => setFormSchema(e.target.value)} placeholder="public" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('documents.database.form.username')}</Label>
            <Input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder={t('documents.database.form.usernamePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('documents.database.form.password')}</Label>
            <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder={editingConnection ? t('documents.database.form.passwordUnchanged') : t('documents.database.form.passwordPlaceholder')} />
          </div>
        </div>
      </div>

      {/* SSL & Mode */}
      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>{t('documents.database.form.ssl')}</Label>
            <p className="text-xs text-muted-foreground mt-0.5">{t('documents.database.form.sslDesc')}</p>
          </div>
          <Switch checked={formSsl} onCheckedChange={setFormSsl} />
        </div>
      </div>

      {/* Connection Settings */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">{t('documents.database.form.sectionSettings')}</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('documents.database.form.connectionTimeout')}</Label>
            <Input value={formConnectionTimeout} onChange={(e) => setFormConnectionTimeout(e.target.value)} placeholder="30" />
          </div>
          <div className="space-y-2">
            <Label>{t('documents.database.form.queryTimeout')}</Label>
            <Input value={formQueryTimeout} onChange={(e) => setFormQueryTimeout(e.target.value)} placeholder="300" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('documents.database.form.poolSize')}</Label>
            <Input value={formPoolSize} onChange={(e) => setFormPoolSize(e.target.value)} placeholder="5" />
          </div>
          <div className="space-y-2">
            <Label>{t('documents.database.form.maxOverflow')}</Label>
            <Input value={formMaxOverflow} onChange={(e) => setFormMaxOverflow(e.target.value)} placeholder="10" />
          </div>
        </div>
      </div>

      {/* Query Policy */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">{t('documents.database.form.sectionPolicy')}</h4>
        <div className="flex items-center justify-between">
          <div>
            <Label>{t('documents.database.form.readOnly')}</Label>
            <p className="text-xs text-muted-foreground mt-0.5">{t('documents.database.form.readOnlyDesc')}</p>
          </div>
          <Switch checked={formReadOnly} onCheckedChange={setFormReadOnly} />
        </div>
        <div className="space-y-2">
          <Label>{t('documents.database.form.maxRowsLimit')}</Label>
          <Input value={formMaxRowsLimit} onChange={(e) => setFormMaxRowsLimit(e.target.value)} placeholder="10000" />
        </div>
        <div className="space-y-2">
          <Label>{t('documents.database.form.allowedTables')}</Label>
          <Input value={formAllowedTables} onChange={(e) => setFormAllowedTables(e.target.value)} placeholder={t('documents.database.form.allowedTablesPlaceholder')} />
        </div>
        <div className="space-y-2">
          <Label>{t('documents.database.form.deniedTables')}</Label>
          <Input value={formDeniedTables} onChange={(e) => setFormDeniedTables(e.target.value)} placeholder={t('documents.database.form.deniedTablesPlaceholder')} />
        </div>
      </div>
    </div>
  );

  // ── Documentation connection map ──
  const docConnections = useMemo(() => {
    return dbConnections.map(db => ({
      id: db.numericId,
      connectionName: db.connectionName,
      dbType: db.dbType,
      host: db.host,
      port: db.port,
      databaseName: db.databaseName,
      isActive: db.isActive,
    }));
  }, [dbConnections]);

  const handlePreselectedHandled = useCallback(() => {
    setDocPreselectedConnectionId(undefined);
  }, []);

  // ── Render ──
  if (subTab === 'documentation') {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <DbDocumentation
          connections={docConnections}
          preselectedConnectionId={docPreselectedConnectionId}
          onPreselectedHandled={handlePreselectedHandled}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ResourceCardGrid
          items={cardItems}
          loading={loading}
          showEmptyState
          emptyStateProps={{
            icon: <FiDatabase />,
            title: error || t('documents.database.empty.title'),
            description: error ? undefined : t('documents.database.empty.description'),
            action: error
              ? { label: t('common.retry'), onClick: loadData }
              : { label: t('documents.database.buttons.newConnection'), onClick: () => setIsCreateModalOpen(true) },
          }}
        />
      </div>

      {/* ── Create Modal ── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title={t('documents.database.createModal.title')}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseCreateModal}>
              {t('documents.database.form.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={creating || !formName.trim() || !formHost.trim() || !formDatabase.trim()}>
              {creating ? t('documents.database.form.creating') : t('documents.database.form.create')}
            </Button>
          </div>
        }
      >
        {connectionFormContent}
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title={t('documents.database.editModal.title')}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseEditModal}>
              {t('documents.database.form.cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={updating || !formName.trim() || !formHost.trim() || !formDatabase.trim()}>
              {updating ? t('documents.database.form.updating') : t('documents.database.form.update')}
            </Button>
          </div>
        }
      >
        {connectionFormContent}
      </Modal>

      {/* ── Share Modal ── */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => { setIsShareModalOpen(false); setSharingConnection(null); }}
        title={t('documents.database.shareModal.title')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setIsShareModalOpen(false); setSharingConnection(null); }}>
              {t('documents.database.form.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleSaveShare} disabled={savingShare}>
              {savingShare ? t('documents.database.shareModal.saving') : t('documents.database.shareModal.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('documents.database.shareModal.description', { name: sharingConnection?.connectionName || '' })}
          </p>
          <button
            type="button"
            onClick={() => setShareEnabled(!shareEnabled)}
            className={`w-full px-4 py-2.5 text-sm text-center rounded-lg border transition-colors ${
              shareEnabled
                ? 'border-blue-400 bg-blue-50 text-blue-600'
                : 'border-gray-200 bg-white text-foreground hover:bg-gray-50'
            }`}
          >
            {shareEnabled ? t('documents.database.shareModal.shared') : t('documents.database.shareModal.private')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentDatabase;

export const documentDatabasePlugin: DocumentTabPlugin = {
  id: 'database',
  name: 'Document Database',
  tabLabelKey: 'documents.tabs.database',
  order: 4,
  component: DocumentDatabase,
};
