'use client';

import React from 'react';
import type { BackendLog } from '../types';

interface LogDetailModalProps {
  log: BackendLog;
  onClose: () => void;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card rounded-xl border border-border shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Log Detail</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <Field label="Log ID" value={log.log_id} mono />
            <Field label="Level" value={log.log_level} />
            <Field label="Function" value={log.function_name ?? '-'} mono />
            <Field label="API Endpoint" value={log.api_endpoint ?? '-'} mono />
            <Field label="User ID" value={log.user_id !== null ? String(log.user_id) : '-'} />
            <Field label="Created" value={new Date(log.created_at).toLocaleString()} />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Message</p>
            <pre className="text-sm bg-muted/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words text-foreground">
              {log.message}
            </pre>
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Metadata</p>
              <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto text-foreground font-mono">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm text-foreground ${mono ? 'font-mono' : ''} break-all`}>{value}</p>
    </div>
  );
}
