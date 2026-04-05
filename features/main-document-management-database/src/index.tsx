'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps } from '@xgen/types';
import { Button, EmptyState, SearchInput, Modal, Input, Label, Switch, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface DBConnectionItem {
  id: string;
  connectionName: string;
  dbType: 'postgresql' | 'mysql' | 'mssql' | 'oracle';
  host: string;
  port: number;
  databaseName: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const DatabaseIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="10" cy="4.167" rx="7.5" ry="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M17.5 10c0 1.38-3.358 2.5-7.5 2.5S2.5 11.38 2.5 10M17.5 4.167v11.666c0 1.381-3.358 2.5-7.5 2.5s-7.5-1.119-7.5-2.5V4.167" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const SharedIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.5 4.667a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM3.5 8.75a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM10.5 12.833a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM5.075 7.928l3.858 2.227M5.075 5.845l3.858-2.228" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const EmptyIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 6H14C12.939 6 11.922 6.421 11.172 7.172C10.421 7.922 10 8.939 10 10V38C10 39.061 10.421 40.078 11.172 40.828C11.922 41.579 12.939 42 14 42H34C35.061 42 36.078 41.579 36.828 40.828C37.579 40.078 38 39.061 38 38V16L28 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 6V16H38M32 26H16M32 34H16M20 18H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_DB_CONNECTIONS: DBConnectionItem[] = [
  {
    id: 'db-001',
    connectionName: '운영 DB',
    dbType: 'postgresql',
    host: 'prod-db.example.com',
    port: 5432,
    databaseName: 'xgen_prod',
    isShared: true,
    createdAt: '2025-01-03T10:00:00Z',
    updatedAt: '2025-01-25T14:00:00Z',
  },
  {
    id: 'db-002',
    connectionName: '개발 DB',
    dbType: 'postgresql',
    host: 'dev-db.example.com',
    port: 5432,
    databaseName: 'xgen_dev',
    isShared: false,
    createdAt: '2025-01-05T09:00:00Z',
    updatedAt: '2025-01-26T10:00:00Z',
  },
  {
    id: 'db-003',
    connectionName: '분석 DB',
    dbType: 'mysql',
    host: 'analytics.example.com',
    port: 3306,
    databaseName: 'analytics',
    isShared: true,
    createdAt: '2025-01-10T11:00:00Z',
    updatedAt: '2025-01-27T16:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// DocumentDatabase Component (데이터베이스 탭)
// ─────────────────────────────────────────────────────────────

export interface DocumentDatabaseProps extends DocumentTabPluginProps {}

export const DocumentDatabase: React.FC<DocumentDatabaseProps> = ({ onSubToolbarChange }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dbConnections, setDbConnections] = useState<DBConnectionItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [newDbType, setNewDbType] = useState<DBConnectionItem['dbType']>('postgresql');
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
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setDbConnections(MOCK_DB_CONNECTIONS);
    } catch (error) {
      console.error('Failed to load DB connections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const DB_TYPE_PORTS: Record<string, string> = { postgresql: '5432', mysql: '3306', mssql: '1433', oracle: '1521' };

  const handleDbTypeChange = useCallback((type: string) => {
    setNewDbType(type as DBConnectionItem['dbType']);
    setNewDbPort(DB_TYPE_PORTS[type] || '5432');
  }, []);

  const handleCreateConnection = useCallback(async () => {
    if (!newDbName.trim() || !newDbHost.trim() || !newDbDatabase.trim()) return;
    setCreating(true);
    try {
      // TODO: API call to create DB connection
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsCreateModalOpen(false);
      setNewDbName(''); setNewDbType('postgresql'); setNewDbHost('');
      setNewDbPort('5432'); setNewDbDatabase(''); setNewDbUsername('');
      setNewDbPassword(''); setNewDbSsl(false); setNewDbReadOnly(true);
      await loadData();
    } catch (error) {
      console.error('Failed to create DB connection:', error);
    } finally {
      setCreating(false);
    }
  }, [newDbName, newDbHost, newDbDatabase, loadData]);

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
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredDbConnections.length === 0 ? (
          <EmptyState
            icon={<EmptyIcon />}
            title={t('documents.database.empty.title')}
            description={t('documents.database.empty.description')}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {filteredDbConnections.map(db => (
              <div key={db.id} className="flex flex-col p-5 bg-card border border-border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-500">
                    <DatabaseIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{db.connectionName}</h3>
                      {db.isShared && (
                        <span className="text-muted-foreground shrink-0"><SharedIcon /></span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{db.dbType}</span>
                  </div>
                </div>
                <div className="text-[12px] text-muted-foreground mb-3 font-mono truncate">
                  {db.host}:{db.port}/{db.databaseName}
                </div>
                <div className="text-xs text-muted-foreground/60 mt-auto">
                  {formatDate(db.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
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
