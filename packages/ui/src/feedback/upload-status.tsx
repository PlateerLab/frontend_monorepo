'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type UploadSessionStatus =
  | 'uploading'    // File being sent to server
  | 'processing'   // Server processing (chunking)
  | 'embedding'    // Embedding in progress
  | 'complete'     // Done
  | 'error';       // Failed

export interface UploadSession {
  id: string;
  fileName: string;
  targetName: string;       // Collection name or storage name
  status: UploadSessionStatus;
  totalChunks: number;
  processedChunks: number;
  errorMessage?: string;
  createdAt: number;
}

export interface UploadStatusContextValue {
  sessions: UploadSession[];
  addSession: (session: Omit<UploadSession, 'createdAt'>) => void;
  updateSession: (id: string, updates: Partial<UploadSession>) => void;
  removeSession: (id: string) => void;
  clearCompleted: () => void;
  /** Register a handler to be called when user clicks a session in the panel */
  registerSessionClickHandler: (handler: ((session: UploadSession) => void) | null) => void;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const UploadStatusContext = createContext<UploadStatusContextValue | null>(null);

export function useUploadStatus(): UploadStatusContextValue {
  const ctx = useContext(UploadStatusContext);
  if (!ctx) throw new Error('useUploadStatus must be used within UploadStatusProvider');
  return ctx;
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export interface UploadStatusProviderProps {
  children: React.ReactNode;
  /** Delay in ms before auto-removing completed sessions (default: 2000) */
  autoRemoveDelay?: number;
}

export const UploadStatusProvider: React.FC<UploadStatusProviderProps> = ({
  children,
  autoRemoveDelay = 2000,
}) => {
  const [sessions, setSessions] = useState<UploadSession[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const sessionClickHandlerRef = useRef<((session: UploadSession) => void) | null>(null);

  const registerSessionClickHandler = useCallback((handler: ((session: UploadSession) => void) | null) => {
    sessionClickHandlerRef.current = handler;
  }, []);

  const scheduleRemove = useCallback((id: string) => {
    if (timersRef.current.has(id)) return;
    const timer = setTimeout(() => {
      setSessions(prev => prev.filter(s => s.id !== id));
      timersRef.current.delete(id);
    }, autoRemoveDelay);
    timersRef.current.set(id, timer);
  }, [autoRemoveDelay]);

  const addSession = useCallback((session: Omit<UploadSession, 'createdAt'>) => {
    setSessions(prev => [...prev, { ...session, createdAt: Date.now() }]);
  }, []);

  const updateSession = useCallback((id: string, updates: Partial<UploadSession>) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates };
      if (updated.status === 'complete') {
        scheduleRemove(id);
      }
      return updated;
    }));
  }, [scheduleRemove]);

  const removeSession = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setSessions(prev => {
      prev.filter(s => s.status === 'complete' || s.status === 'error').forEach(s => {
        const timer = timersRef.current.get(s.id);
        if (timer) { clearTimeout(timer); timersRef.current.delete(s.id); }
      });
      return prev.filter(s => s.status !== 'complete' && s.status !== 'error');
    });
  }, []);

  return (
    <UploadStatusContext.Provider value={{ sessions, addSession, updateSession, removeSession, clearCompleted, registerSessionClickHandler }}>
      <SessionClickContext.Provider value={sessionClickHandlerRef}>
        {children}
      </SessionClickContext.Provider>
    </UploadStatusContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// Floating Panel Component
// ─────────────────────────────────────────────────────────────

export interface UploadStatusPanelProps {
  // No props needed — click handler is registered via context
}

const statusLabelsKo: Record<UploadSessionStatus, string> = {
  uploading: '업로드 중...',
  processing: '문서 처리 중...',
  embedding: '임베딩 중...',
  complete: '완료',
  error: '오류',
};

const StatusIcon: React.FC<{ status: UploadSessionStatus }> = ({ status }) => {
  switch (status) {
    case 'complete':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'error':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case 'embedding':
      return <span style={{ fontSize: 14, animation: 'upload-panel-pulse 1.5s ease-in-out infinite' }}>🧠</span>;
    case 'processing':
      return <span style={{ fontSize: 14, animation: 'upload-panel-pulse 1.5s ease-in-out infinite' }}>⚙️</span>;
    default:
      return <span style={{ fontSize: 14, animation: 'upload-panel-pulse 2s infinite' }}>📤</span>;
  }
};

// Internal context for click handler (avoids re-renders)
const SessionClickContext = createContext<React.RefObject<((session: UploadSession) => void) | null> | null>(null);

export const UploadStatusPanel: React.FC<UploadStatusPanelProps> = () => {
  const { sessions, removeSession } = useUploadStatus();
  const clickRef = useContext(SessionClickContext);
  const onSessionClick = clickRef?.current ?? null;
  const [collapsed, setCollapsed] = useState(false);

  if (sessions.length === 0) return null;

  const activeCount = sessions.filter(s => s.status !== 'complete' && s.status !== 'error').length;
  const headerText = activeCount > 0
    ? `업로드 중 (${activeCount})`
    : '업로드 완료';

  return (
    <>
      <style>{`
        @keyframes upload-panel-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1001,
          minWidth: 300,
          maxWidth: 360,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          fontFamily: 'inherit',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: activeCount > 0 ? '#3b82f6' : '#22c55e',
            color: '#fff',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'background 0.3s',
          }}
          onClick={() => setCollapsed(c => !c)}
        >
          <span style={{ fontSize: 14, animation: activeCount > 0 ? 'upload-panel-pulse 2s infinite' : undefined }}>
            {activeCount > 0 ? '📤' : '✅'}
          </span>
          <span style={{ flex: 1 }}>{headerText}</span>
          <span style={{ fontSize: 12, transform: collapsed ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
            ▼
          </span>
        </div>

        {/* Session list */}
        {!collapsed && (
          <div style={{ background: '#fff', maxHeight: 320, overflowY: 'auto' }}>
            {sessions.map(session => {
              const progress = session.totalChunks > 0
                ? Math.round((session.processedChunks / session.totalChunks) * 100)
                : 0;
              const statusText = statusLabelsKo[session.status];
              const isActive = session.status !== 'complete' && session.status !== 'error';

              return (
                <div
                  key={session.id}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    cursor: onSessionClick ? 'pointer' : undefined,
                  }}
                  onClick={() => onSessionClick?.(session)}
                >
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    <StatusIcon status={session.status} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#1f2937',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {session.fileName}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      → {session.targetName}
                      {isActive && session.totalChunks > 0 && (
                        <span style={{ color: '#3b82f6', fontWeight: 500 }}>
                          {' '}({session.processedChunks}/{session.totalChunks})
                        </span>
                      )}
                    </div>
                    {session.status === 'error' && session.errorMessage && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                        {session.errorMessage}
                      </div>
                    )}
                    {/* Progress bar */}
                    {isActive && session.totalChunks > 0 && (
                      <div style={{
                        marginTop: 6,
                        height: 4,
                        borderRadius: 2,
                        background: '#e5e7eb',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: session.status === 'embedding' ? '#8b5cf6' : '#3b82f6',
                          borderRadius: 2,
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    )}
                    {/* Status text */}
                    <div style={{
                      fontSize: 11,
                      color: session.status === 'complete' ? '#22c55e'
                        : session.status === 'error' ? '#ef4444'
                        : '#6b7280',
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {statusText}
                      {isActive && session.totalChunks > 0 && (
                        <span style={{ color: '#3b82f6' }}>{progress}%</span>
                      )}
                    </div>
                  </div>
                  {/* Close button for completed/error */}
                  {(session.status === 'complete' || session.status === 'error') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSession(session.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#9ca3af',
                        padding: 2,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
