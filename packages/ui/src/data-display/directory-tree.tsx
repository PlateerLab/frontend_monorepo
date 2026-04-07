'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { isExternalFileDrag, extractFilesFromDataTransfer } from '../hooks/use-external-drop';
import type { ExternalDropResult } from '../hooks/use-external-drop'; // used in onExternalFileDrop prop

// ─────────────────────────────────────────────────────────────
// Generic Types
// ─────────────────────────────────────────────────────────────

/** Normalized folder for the tree */
export interface TreeFolder {
  id: number;
  name: string;
  fullPath: string;
  parentFolderId: number | null;
  isRoot: boolean;
}

/** Normalized file for the tree */
export interface TreeFile {
  id: string;
  name: string;
  /** The folder path this file belongs to (empty or "/" = root) */
  folderPath: string;
  /** Optional badge text shown next to the file name (e.g. chunk count) */
  badge?: string;
  /** Sort key (e.g. timestamp) — higher values appear first */
  sortKey?: number;
}

/** Root container info (collection or storage) */
export interface TreeRoot {
  displayName: string;
}

// ─────────────────────────────────────────────────────────────
// Internal Tree Node
// ─────────────────────────────────────────────────────────────

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  children: TreeNode[];
  folderData?: TreeFolder;
  fileData?: TreeFile;
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface DirectoryTreeProps {
  root: TreeRoot;
  folders: TreeFolder[];
  files: TreeFile[];
  /** Currently active folder (null = root) */
  currentFolder: TreeFolder | null;
  loading: boolean;
  onNavigateToFolder: (folder: TreeFolder | null) => void;
  onSelectFile?: (file: TreeFile) => void;
  /** Called when a file is dropped onto a folder */
  onMoveFile?: (file: TreeFile, targetFolder: TreeFolder | null) => void;
  /** Called when a folder is dropped onto another folder */
  onMoveFolder?: (folder: TreeFolder, targetFolder: TreeFolder | null) => void;
  /** Called when external files (from OS) are dropped onto a folder node */
  onExternalFileDrop?: (result: ExternalDropResult, targetFolder: TreeFolder | null) => void;
  /** Header title */
  title?: string;
  /** File count suffix (e.g. " files") */
  fileSuffix?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Icon override for root node (defaults to database icon) */
  rootIcon?: React.ReactNode;
  /** Icon override for folder nodes */
  folderIcon?: React.ReactNode;
  /** Icon override for file nodes */
  fileIcon?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────
// Icons (inline SVGs to avoid external dependency)
// ─────────────────────────────────────────────────────────────

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
);
const DatabaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
);
const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
);
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  root,
  folders,
  files,
  currentFolder,
  loading,
  onNavigateToFolder,
  onSelectFile,
  onMoveFile,
  onMoveFolder,
  onExternalFileDrop,
  title = 'Directory Structure',
  fileSuffix = ' files',
  searchPlaceholder = 'Search files...',
  rootIcon,
  folderIcon,
  fileIcon,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedFile, setDraggedFile] = useState<TreeFile | null>(null);
  const [draggedFolder, setDraggedFolder] = useState<TreeFolder | null>(null);
  const [dragOverFolderPath, setDragOverFolderPath] = useState<string | null>(null);

  // Reset search when root changes
  useEffect(() => {
    setSearchQuery('');
  }, [root.displayName]);

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

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  // Build tree
  const treeData = useMemo(() => {
    const rootPath = `/${root.displayName}`;
    const rootNode: TreeNode = {
      id: 'root',
      name: root.displayName,
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
        name: folder.name || folder.fullPath?.split('/').filter(Boolean).pop() || `folder-${folder.id}`,
        type: 'folder',
        path: folder.fullPath,
        children: [],
        folderData: folder,
      };
      nodeMap.set(node.id, node);
    });

    // File nodes (sorted by sortKey desc)
    const sortedFiles = [...filteredFiles].sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0));

    sortedFiles.forEach(file => {
      const node: TreeNode = {
        id: `file-${file.id}`,
        name: file.name,
        type: 'file',
        path: file.folderPath || rootPath,
        children: [],
        fileData: file,
      };
      nodeMap.set(node.id, node);
    });

    // Build parent-child relationships
    nodeMap.forEach(node => {
      if (node.id === 'root') return;

      let parentNode: TreeNode | undefined;

      if (node.type === 'folder' && node.folderData) {
        if (node.folderData.isRoot) {
          parentNode = rootNode;
        } else {
          const parentFolder = folders.find(f => f.id === node.folderData!.parentFolderId);
          parentNode = parentFolder ? nodeMap.get(`folder-${parentFolder.id}`) : rootNode;
        }
      } else if (node.type === 'file') {
        const filePath = node.path;
        if (!filePath || filePath === rootPath || filePath === '/') {
          parentNode = rootNode;
        } else {
          const parentFolder = folders.find(f => f.fullPath === filePath);
          parentNode = parentFolder ? nodeMap.get(`folder-${parentFolder.id}`) : rootNode;
        }
      }

      if (parentNode) {
        parentNode.children.push(node);
      }
    });

    // Sort children: folders first (by name), then files
    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        if (a.type === 'folder') return (a.name || '').localeCompare(b.name || '');
        return 0; // files already sorted
      });
      node.children.forEach(sortChildren);
    };
    sortChildren(rootNode);

    return [rootNode];
  }, [root.displayName, folders, filteredFiles]);

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
    setDraggedFile(null);
    setDraggedFolder(null);
    setDragOverFolderPath(null);
  }, []);

  const handleFileDragStart = useCallback((e: React.DragEvent, file: TreeFile) => {
    setDraggedFile(file);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);
  }, []);

  const handleFolderDragStart = useCallback((e: React.DragEvent, folder: TreeFolder) => {
    setDraggedFolder(folder);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `folder-${folder.id}`);
  }, []);

  const handleFolderDragOver = useCallback((e: React.DragEvent, folderPath: string, folderData?: TreeFolder) => {
    const isExternal = isExternalFileDrag(e) && !draggedFile && !draggedFolder;
    if (!draggedFile && !draggedFolder && !(isExternal && onExternalFileDrop)) return;
    if (draggedFolder && folderData) {
      if (folderPath === draggedFolder.fullPath || folderPath.startsWith(draggedFolder.fullPath + '/')) return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = isExternal ? 'copy' : 'move';
    setDragOverFolderPath(folderPath);
  }, [draggedFile, draggedFolder, onExternalFileDrop]);

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

    const targetFolder = targetNode.id === 'root' ? null : (targetNode.folderData ?? null);

    // External file drop (from OS)
    const isExternal = isExternalFileDrag(e) && !draggedFile && !draggedFolder;
    if (isExternal && onExternalFileDrop) {
      const result = await extractFilesFromDataTransfer(e.dataTransfer);
      if (result.files.length > 0) {
        onExternalFileDrop(result, targetFolder);
      }
      return;
    }

    // Internal folder drop
    if (draggedFolder) {
      const targetPath = targetNode.path;
      if (targetPath === draggedFolder.fullPath || targetPath.startsWith(draggedFolder.fullPath + '/')) {
        setDraggedFolder(null);
        return;
      }
      onMoveFolder?.(draggedFolder, targetFolder);
      setDraggedFolder(null);
      return;
    }

    // Internal file drop
    if (draggedFile) {
      onMoveFile?.(draggedFile, targetFolder);
      setDraggedFile(null);
    }
  }, [draggedFolder, draggedFile, onMoveFolder, onMoveFile, onExternalFileDrop]);

  const hasDragSupport = !!(onMoveFile || onMoveFolder);
  const hasAnyDropSupport = hasDragSupport || !!onExternalFileDrop;

  // ── Render Tree Node ──
  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isCurrentFolder = currentFolder
      ? (node.type === 'folder' && node.folderData && node.folderData.id === currentFolder.id)
      : node.id === 'root';
    const isDragOver = node.type === 'folder' && dragOverFolderPath === node.path;
    const isFolderDraggable = hasDragSupport && node.type === 'folder' && node.id !== 'root';
    const isFileDraggable = hasDragSupport && node.type === 'file';

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
              } else if (node.folderData) {
                onNavigateToFolder(node.folderData);
              }
            } else if (node.type === 'file' && node.fileData && onSelectFile) {
              onSelectFile(node.fileData);
            }
          }}
          draggable={isFileDraggable || isFolderDraggable}
          onDragStart={
            node.type === 'file' && node.fileData
              ? (e) => handleFileDragStart(e, node.fileData!)
              : isFolderDraggable && node.folderData
                ? (e) => handleFolderDragStart(e, node.folderData!)
                : undefined
          }
          onDragEnd={(isFileDraggable || isFolderDraggable) ? handleDragEnd : undefined}
          onDragOver={node.type === 'folder' && hasAnyDropSupport ? (e) => handleFolderDragOver(e, node.path, node.folderData) : undefined}
          onDragLeave={node.type === 'folder' && hasAnyDropSupport ? (e) => handleFolderDragLeave(e, node.path) : undefined}
          onDrop={node.type === 'folder' && hasAnyDropSupport ? (e) => handleFolderDrop(e, node) : undefined}
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
                isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />
              ) : null}
            </span>
          ) : (
            <span className="w-4 h-4 shrink-0" />
          )}

          {/* Icon */}
          {node.type === 'folder' ? (
            node.id === 'root' ? (
              <span className="w-4 h-4 text-primary shrink-0 flex items-center justify-center">
                {rootIcon || <DatabaseIcon />}
              </span>
            ) : (
              <span className="w-4 h-4 text-blue-500 shrink-0 flex items-center justify-center">
                {folderIcon || <FolderIcon />}
              </span>
            )
          ) : (
            <span className="w-4 h-4 text-orange-500 shrink-0 flex items-center justify-center">
              {fileIcon || <FileIcon />}
            </span>
          )}

          {/* Name */}
          <span className="truncate flex-1 min-w-0">{node.name}</span>

          {/* Badge (e.g. chunk count for files) */}
          {node.type === 'file' && node.fileData?.badge && (
            <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
              ({node.fileData.badge})
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
          {title} : {files.length}{fileSuffix}
        </p>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="w-full pl-7 pr-7 py-1.5 text-xs bg-muted/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setSearchQuery('')}
            >
              <XIcon />
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
            Empty
          </p>
        ) : (
          treeData.map(node => renderNode(node))
        )}
      </div>
    </div>
  );
};
