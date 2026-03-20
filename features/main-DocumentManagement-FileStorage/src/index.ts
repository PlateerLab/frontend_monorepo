'use client';
import React, { useState } from 'react';
import type { FeatureModule, DocumentTabConfig, RouteComponentProps } from '@xgen/types';

/* ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•
   Document File Storage
   - ?Œì¼ ?¤í† ë¦¬ì? ?? ?”ë ‰? ë¦¬ ?¸ë¦¬
   ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â• */

/* ?€?€ FileStorageDirectoryTree ?€?€ */
export const FileStorageDirectoryTree: React.FC<{
  files: Array<{ id: string; name: string; path: string; size: number; type: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  onUpload?: () => void;
  onDelete?: (id: string) => void;
}> = ({ files, selectedId, onSelect, onUpload, onDelete }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
      <span className="text-xs font-medium text-gray-600">?Œì¼ ?¤í† ë¦¬ì?</span>
      {onUpload && <button onClick={onUpload} className="text-xs text-blue-600 hover:underline">+ ?…ë¡œ??/button>}
    </div>
    <div className="flex-1 overflow-y-auto">
      {files.map(f => (
        <div key={f.id} onClick={() => onSelect(f.id)}
          className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm ${selectedId === f.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span>{f.type === 'folder' ? '?“' : '?“„'}</span>
            <span className="truncate">{f.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)}KB</span>
            {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(f.id); }} className="text-xs text-gray-400 hover:text-red-500">Ã—</button>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ?€?€ DocumentFileStorageSection ?€?€ */
const DocumentFileStorageSection: React.FC<RouteComponentProps> = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  return (
    <div className="flex h-full">
      <FileStorageDirectoryTree files={[]} selectedId={selectedFile || undefined} onSelect={setSelectedFile} />
      <div className="flex-1 flex items-center justify-center text-gray-400">
        {selectedFile ? `?Œì¼ ë¯¸ë¦¬ë³´ê¸°: ${selectedFile}` : '?Œì¼??? íƒ?˜ì„¸??}
      </div>
    </div>
  );
};

export const documentFilestorageFeature: FeatureModule = {
  id: 'main-DocumentManagement-FileStorage',
  name: 'Document File Storage',
  sidebarSection: 'workflow',
  sidebarItems: [],
  routes: {},
};

export const documentFilestorageTab: DocumentTabConfig = {
  id: 'filestorage',
  titleKey: 'documents.tab.filestorage',
  order: 2,
  component: DocumentFileStorageSection,
};

export { DocumentFileStorageSection };
export default documentFilestorageFeature;