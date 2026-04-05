'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps, CardBadge } from '@xgen/types';
import { Button, SearchInput, Modal, Input, Label, Switch, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, ResourceCardGrid } from '@xgen/ui';
import { FiDatabase, FiClock, FiTrash2 } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { listDBConnections, createDBConnection, deleteDBConnection, type DBConnectionItem } from './api';
import './locales';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

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

export const DocumentDatabase: React.FC<DocumentDatabaseProps> = ({ onSubToolbarChange }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dbConnections, setDbConnections] = useState<DBConnectionItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [newDbType, setNewDbType] = useState('postgresql');
  const [newDbHost, setNewDbHost] = useState('');
  const [newDbPort, setNewDbPort] = useState('5432');
  const [newDbDatabase, setNewDbDatabase] = useState('');
  const [newDbUsername, setNewDbUsername] = useState('');
  const [newDbPassword, setNewDbPassword] = useState('');
  const [newDbSsl, setNewDbSsl] = useState(false);
  const [newDbReadOnly, setNewDbReadOnly] = useState(true);
  const [creating, setCreating] = useState(false);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const DB_TYPE_PORTS: Record<string, string> = { postgresql: '5432', mysql: '3306', mssql: '1433', oracle: '1521' };

  const handleDbTypeChange = useCallback((type: string) => {
    setNewDbType(type);
    setNewDbPort(DB_TYPE_PORTS[type] || '5432');
  }, []);

  const handleCreateConnection = useCallback(async () => {
    if (!newDbName.trim() || !newDbHost.trim() || !newDbDatabase.trim()) return;
    setCreating(true);
    try {
      await createDBConnection({
        connection_name: newDbName.trim(),
        db_type: newDbType,
        db_host: newDbHost.trim(),
        db_port: parseInt(newDbPort, 10) || 5432,
        db_name: newDbDatabase.trim(),
        db_username: newDbUsername.trim() || undefined,
        db_password: newDbPassword || undefined,
        use_ssl: newDbSsl,
        read_only: newDbReadOnly,
      });
      setIsCreateModalOpen(false);
      setNewDbName(''); setNewDbType('postgresql'); setNewDbHost('');
      setNewDbPort('5432'); setNewDbDatabase(''); setNewDbUsername('');
      setNewDbPassword(''); setNewDbSsl(false); setNewDbReadOnly(true);
      await loadData();
    } catch (err) {
      console.error('Failed to create DB connection:', err);
    } finally {
      setCreating(false);
    }
  }, [newDbName, newDbType, newDbHost, newDbPort, newDbDatabase, newDbUsername, newDbPassword, newDbSsl, newDbReadOnly, loadData]);

  const handleDeleteConnection = useCallback(async (db: DBConnectionItem) => {
    try {
      await deleteDBConnection(db.numericId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete DB connection:', err);
    }
  }, [loadData]);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setNewDbName(''); setNewDbType('postgresql'); setNewDbHost('');
    setNewDbPort('5432'); setNewDbDatabase(''); setNewDbUsername('');
    setNewDbPassword(''); setNewDbSsl(false); setNewDbReadOnly(true);
  }, []);

  const filteredDbConnections = useMemo(() => {
    if (!search) return dbConnections;
    return dbConnections.filter(db => db.connectionName.toLowerCase().includes(search.toLowerCase()));
  }, [dbConnections, search]);

  // ── Card Items ──
  const cardItems = useMemo(() => {
    return filteredDbConnections.map((db) => {
      const badges: CardBadge[] = [];
      badges.push({
        text: db.dbType.toUpperCase(),
        variant: 'outline' as any,
      });
      if (db.isShared) {
        badges.push({
          text: t('documents.database.shared'),
          variant: 'primary',
        });
      }

      return {
        id: db.id,
        data: db,
        title: db.connectionName,
        description: `${db.host}:${db.port}/${db.databaseName}`,
        thumbnail: {
          icon: <FiDatabase />,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          iconColor: '#8b5cf6',
        },
        badges,
        metadata: [
          { value: `${db.host}:${db.port}` },
          ...(db.updatedAt ? [{ icon: <FiClock />, value: formatDate(db.updatedAt) }] : []),
        ],
        dropdownActions: [
          {
            id: 'delete',
            icon: <FiTrash2 />,
            label: t('common.delete'),
            danger: true,
            onClick: () => handleDeleteConnection(db),
          },
        ],
        onClick: () => {},
      };
    });
  }, [filteredDbConnections, handleDeleteConnection, t]);

  // Push subToolbar content to orchestrator
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div />
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('documents.database.searchPlaceholder')}
            size="sm"
          />
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon />
            {t('documents.database.buttons.newConnection')}
          </Button>
        </div>
      </div>
    );
  }, [onSubToolbarChange, search, t]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

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

      {/* Create DB Connection Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title={t('documents.database.createModal.title')}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseCreateModal}>
              {t('documents.database.createModal.cancel')}
            </Button>
            <Button onClick={handleCreateConnection} disabled={creating || !newDbName.trim() || !newDbHost.trim() || !newDbDatabase.trim()}>
              {creating ? t('documents.database.createModal.creating') : t('documents.database.createModal.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('documents.database.createModal.connectionName')}</Label>
            <Input
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder={t('documents.database.createModal.connectionNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('documents.database.createModal.dbType')}</Label>
            <Select value={newDbType} onValueChange={handleDbTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="mssql">MSSQL</SelectItem>
                <SelectItem value="oracle">Oracle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-2">
              <Label>{t('documents.database.createModal.host')}</Label>
              <Input
                value={newDbHost}
                onChange={(e) => setNewDbHost(e.target.value)}
                placeholder={t('documents.database.createModal.hostPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('documents.database.createModal.port')}</Label>
              <Input
                value={newDbPort}
                onChange={(e) => setNewDbPort(e.target.value)}
                placeholder={DB_TYPE_PORTS[newDbType]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('documents.database.createModal.database')}</Label>
            <Input
              value={newDbDatabase}
              onChange={(e) => setNewDbDatabase(e.target.value)}
              placeholder={t('documents.database.createModal.databasePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('documents.database.createModal.username')}</Label>
              <Input
                value={newDbUsername}
                onChange={(e) => setNewDbUsername(e.target.value)}
                placeholder={t('documents.database.createModal.usernamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('documents.database.createModal.password')}</Label>
              <Input
                type="password"
                value={newDbPassword}
                onChange={(e) => setNewDbPassword(e.target.value)}
                placeholder={t('documents.database.createModal.passwordPlaceholder')}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('documents.database.createModal.ssl')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('documents.database.createModal.sslDesc')}</p>
            </div>
            <Switch checked={newDbSsl} onCheckedChange={setNewDbSsl} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('documents.database.createModal.readOnly')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('documents.database.createModal.readOnlyDesc')}</p>
            </div>
            <Switch checked={newDbReadOnly} onCheckedChange={setNewDbReadOnly} />
          </div>
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
