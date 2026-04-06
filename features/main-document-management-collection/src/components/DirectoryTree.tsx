'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiChevronRight, FiChevronDown, FiFolder, FiFileText, FiSearch, FiX, FiDatabase } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import type { CollectionItem, DocumentItem, FolderItem } from '../api';
import { moveFolder, updateDocumentFolder } from '../api';

// ─────────────────────────────────────────────────────────────
// Tree Node Type
// ─────────────────────────────────────────────────────────────

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  children: TreeNode[];
  data?: FolderItem | DocumentItem;
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface DirectoryTreeProps {
  collection: CollectionItem;
  folders: FolderItem[];
  documents: DocumentItem[];
  currentFolder: FolderItem | null;
  loading: boolean;
  onNavigateToFolder: (folder: FolderItem | null) => void;
  onSelectDocument?: (doc: DocumentItem) => void;
  onDataChanged?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  collection,
  folders,
  documents,
  currentFolder,
  loading,
  onNavigateToFolder,
  onSelectDocument,
  onDataChanged,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedDocument, setDraggedDocument] = useState<DocumentItem | null>(null);
  const [draggedFolder, setDraggedFolder] = useState<FolderItem | null>(null);
  const [dragOverFolderPath, setDragOverFolderPath] = useState<string | null>(null);

  // Reset search when collection changes
  useEffect(() => {
    setSearchQuery('');
  }, [collection.name]);

  // Auto-expand to current folder
  useEffect(() => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.add('root');
      if (currentFolder) {
        next.add(`folder-${currentFolder.id}`);
        folders.forEach(f => {
          if (currentFolder.fullPath.startsWith(f.fullPath) && f.id !== currentFolder.id) {
            next.add(`folder-${f.id}`);
          }
        });
      }
      return next;
    });
  }, [currentFolder, folders]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(doc => doc.fileName.toLowerCase().includes(q));
  }, [documents, searchQuery]);

  // Build tree
  const treeData = useMemo(() => {
    const rootPath = `/${collection.displayName}`;
    const rootNode: TreeNode = {
      id: 'root',
      name: collection.displayName,
      type: 'folder',
      path: rootPath,
      children: [],
    };

    const nodeMap = new Map<string, TreeNode>();
    nodeMap.set('root', rootNode);

    // Folder nodes
    folders.forEach(folder => {
      const node: TreeNode = {
        id: `folder-${folder.id}`,
        name: folder.folderName,
        type: 'folder',
        path: folder.fullPath,
        children: [],
        data: folder,
      };
      nodeMap.set(node.id, node);
    });

    // File nodes
    const sortedDocs = [...filteredDocuments].sort((a, b) => {
      const at = a.processedAt ? new Date(a.processedAt).getTime() : 0;
      const bt = b.processedAt ? new Date(b.processedAt).getTime() : 0;
      return bt - at;
    });

    sortedDocs.forEach(doc => {
      const node: TreeNode = {
        id: `file-${doc.documentId}`,
        name: doc.fileName,
        type: 'file',
        path: doc.directoryFullPath || rootPath,
        children: [],
        data: doc,
      };
      nodeMap.set(node.id, node);
    });

    // Build parent-child relationships
    nodeMap.forEach(node => {
      if (node.id === 'root') return;

      let parentNode: TreeNode | undefined;

      if (node.type === 'folder' && node.data) {
        const folderData = node.data as FolderItem;
        if (folderData.isRoot) {
          parentNode = rootNode;
        } else {
          const parentFolder = folders.find(f => f.id === folderData.parentFolderId);
          parentNode = parentFolder ? nodeMap.get(`folder-${parentFolder.id}`) : rootNode;
        }
      } else if (node.type === 'file') {
        const docPath = node.path;
        if (!docPath || docPath === rootPath || docPath === '/') {
          parentNode = rootNode;
        } else {
          const parentFolder = folders.find(f => f.fullPath === docPath);
          parentNode = parentFolder ? nodeMap.get(`folder-${parentFolder.id}`) : rootNode;
        }
      }

      if (parentNode) {
        parentNode.children.push(node);
      }
    });

    // Sort children: folders first (by name), then files (by date desc)
    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        if (a.type === 'folder') return a.name.localeCompare(b.name);
        return 0; // files already sorted by date
      });
      node.children.forEach(sortChildren);
    };
    sortChildren(rootNode);

    return [rootNode];
  }, [collection.displayName, folders, filteredDocuments]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  // ── Drag & Drop ──
  const handleDragEnd = useCallback(() => {
    setDraggedDocument(null);
    setDraggedFolder(null);
    setDragOverFolderPath(null);
  }, []);

  const handleFileDragStart = useCallback((e: React.DragEvent, doc: DocumentItem) => {
    setDraggedDocument(doc);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', doc.documentId);
  }, []);

  const handleFolderDragStart = useCallback((e: React.DragEvent, folder: FolderItem) => {
    setDraggedFolder(folder);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `folder-${folder.id}`);
  }, []);

  const handleFolderDragOver = useCallback((e: React.DragEvent, folderPath: string, folderData?: FolderItem) => {
    if (!draggedDocument && !draggedFolder) return;
    if (draggedFolder && folderData) {
      if (folderPath === draggedFolder.fullPath || folderPath.startsWith(draggedFolder.fullPath + '/')) return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderPath(folderPath);
  }, [draggedDocument, draggedFolder]);

  const handleFolderDragLeave = useCallback((e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverFolderPath === folderPath) setDragOverFolderPath(null);
  }, [dragOverFolderPath]);

  const handleFolderDrop = useCallback(async (e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderPath(null);

    if (targetNode.type !== 'folder') return;
    const targetPath = targetNode.path;

    const ownerUserId = collection.ownerUserId !== user?.user_id ? collection.ownerUserId : undefined;

    // Folder drop
    if (draggedFolder) {
      if (targetPath === draggedFolder.fullPath || targetPath.startsWith(draggedFolder.fullPath + '/')) {
        setDraggedFolder(null);
        return;
      }

      try {
        let targetFolderId: number | null = null;
        if (targetNode.id !== 'root' && targetNode.data) {
          targetFolderId = (targetNode.data as FolderItem).id;
        }
        await moveFolder(draggedFolder.id, targetFolderId, collection.collectionId, ownerUserId);
        onDataChanged?.();
      } catch (err) {
        console.error('Failed to move folder:', err);
      } finally {
        setDraggedFolder(null);
      }
      return;
    }

    // Document drop
    if (draggedDocument) {
      if (draggedDocument.directoryFullPath === targetPath) {
        setDraggedDocument(null);
        return;
      }

      try {
        await updateDocumentFolder(draggedDocument.documentId, collection.name, targetPath, ownerUserId);
        onDataChanged?.();
      } catch (err) {
        console.error('Failed to move document:', err);
      } finally {
        setDraggedDocument(null);
      }
    }
  }, [draggedFolder, draggedDocument, collection, user, onDataChanged]);

  // ── Render Tree Node ──
  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isCurrentFolder = currentFolder
      ? (node.type === 'folder' && node.data && (node.data as FolderItem).id === currentFolder.id)
      : node.id === 'root';
    const isDragOver = (draggedDocument || draggedFolder) && node.type === 'folder' && dragOverFolderPath === node.path;
    const isFolderDraggable = node.type === 'folder' && node.id !== 'root';

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1 text-sm cursor-pointer rounded transition-colors select-none
            ${isCurrentFolder ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent/50'}
            ${isDragOver ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              if (node.id === 'root') {
                onNavigateToFolder(null);
              } else if (node.data) {
                onNavigateToFolder(node.data as FolderItem);
              }
            } else if (node.type === 'file' && node.data && onSelectDocument) {
              onSelectDocument(node.data as DocumentItem);
            }
          }}
          draggable={node.type === 'file' || isFolderDraggable}
          onDragStart={
            node.type === 'file' && node.data
              ? (e) => handleFileDragStart(e, node.data as DocumentItem)
              : isFolderDraggable && node.data
                ? (e) => handleFolderDragStart(e, node.data as FolderItem)
                : undefined
          }
          onDragEnd={(node.type === 'file' || isFolderDraggable) ? handleDragEnd : undefined}
          onDragOver={node.type === 'folder' ? (e) => handleFolderDragOver(e, node.path, node.data as FolderItem | undefined) : undefined}
          onDragLeave={node.type === 'folder' ? (e) => handleFolderDragLeave(e, node.path) : undefined}
          onDrop={node.type === 'folder' ? (e) => handleFolderDrop(e, node) : undefined}
        >
          {/* Expand/Collapse icon */}
          {node.type === 'folder' ? (
            <span
              className="w-4 h-4 flex items-center justify-center shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleNode(node.id);
              }}
            >
              {hasChildren ? (
                isExpanded ? <FiChevronDown className="w-3.5 h-3.5" /> : <FiChevronRight className="w-3.5 h-3.5" />
              ) : null}
            </span>
          ) : (
            <span className="w-4 h-4 shrink-0" />
          )}

          {/* Icon */}
          {node.type === 'folder' ? (
            node.id === 'root' ? (
              <FiDatabase className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <FiFolder className="w-4 h-4 text-blue-500 shrink-0" />
            )
          ) : (
            <FiFileText className="w-4 h-4 text-orange-500 shrink-0" />
          )}

          {/* Name */}
          <span className="truncate flex-1 min-w-0">{node.name}</span>

          {/* Chunk count for files */}
          {node.type === 'file' && node.data && (
            <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
              ({(node.data as DocumentItem).totalChunks})
            </span>
          )}
        </div>

        {/* Children */}
        {node.type === 'folder' && hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs font-medium text-muted-foreground">
          {t('documents.collection.detail.directoryTree.title')} : {documents.length}{t('documents.collection.detail.directoryTree.filesSuffix')}
        </p>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            className="w-full pl-7 pr-7 py-1.5 text-xs bg-muted/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t('documents.collection.detail.directoryTree.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              <FiX className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : treeData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {t('documents.collection.detail.empty')}
          </p>
        ) : (
          treeData.map(node => renderNode(node))
        )}
      </div>
    </div>
  );
};

export default DirectoryTree;
