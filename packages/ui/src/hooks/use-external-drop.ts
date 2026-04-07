'use client';

import { useState, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ExternalDropResult {
  /** Files extracted from the drop (including files inside folders) */
  files: File[];
  /** Map of file → relative folder path (e.g. "myFolder/sub1") */
  relativePaths: Map<File, string>;
}

export interface UseExternalDropOptions {
  /** Called when external files are dropped */
  onDrop: (result: ExternalDropResult) => void;
  /** Whether drop is disabled */
  disabled?: boolean;
}

export interface UseExternalDropReturn {
  /** Whether an external drag is currently over the target */
  isDragOver: boolean;
  /** Attach these to the drop target element */
  dropHandlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

// ─────────────────────────────────────────────────────────────
// Folder traversal utilities
// ─────────────────────────────────────────────────────────────

function readEntryAsFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

function readDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    reader.readEntries(resolve, reject);
  });
}

async function readAllDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const allEntries: FileSystemEntry[] = [];
  let batch: FileSystemEntry[];
  do {
    batch = await readDirectoryEntries(reader);
    allEntries.push(...batch);
  } while (batch.length > 0);
  return allEntries;
}

async function traverseEntry(
  entry: FileSystemEntry,
  basePath: string,
  files: File[],
  relativePaths: Map<File, string>,
): Promise<void> {
  if (entry.isFile) {
    const file = await readEntryAsFile(entry as FileSystemFileEntry);
    files.push(file);
    relativePaths.set(file, basePath);
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    const entries = await readAllDirectoryEntries(reader);
    const folderPath = basePath ? `${basePath}/${entry.name}` : entry.name;
    for (const child of entries) {
      await traverseEntry(child, folderPath, files, relativePaths);
    }
  }
}

/**
 * Extract all files from a DataTransfer, including files inside folders.
 * Uses webkitGetAsEntry to traverse directory structures.
 */
export async function extractFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<ExternalDropResult> {
  const files: File[] = [];
  const relativePaths = new Map<File, string>();
  const items = Array.from(dataTransfer.items);

  // Check if webkitGetAsEntry is supported (Chrome, Edge, Firefox)
  const hasEntryAPI = items.length > 0 && typeof items[0].webkitGetAsEntry === 'function';

  if (hasEntryAPI) {
    for (const item of items) {
      if (item.kind !== 'file') continue;
      const entry = item.webkitGetAsEntry();
      if (!entry) continue;
      await traverseEntry(entry, '', files, relativePaths);
    }
  } else {
    // Fallback: just use the files directly (no folder traversal)
    for (const item of items) {
      if (item.kind !== 'file') continue;
      const file = item.getAsFile();
      if (file) {
        files.push(file);
        relativePaths.set(file, '');
      }
    }
  }

  return { files, relativePaths };
}

/**
 * Check if a DragEvent contains external files (from OS, not internal drag).
 */
export function isExternalFileDrag(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes('Files');
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

/**
 * Hook for handling external file/folder drag-and-drop from the OS.
 *
 * Usage:
 * ```tsx
 * const { isDragOver, dropHandlers } = useExternalDrop({
 *   onDrop: ({ files, relativePaths }) => { ... },
 * });
 * return <div {...dropHandlers} className={isDragOver ? 'highlight' : ''}>...</div>;
 * ```
 */
export function useExternalDrop({ onDrop, disabled }: UseExternalDropOptions): UseExternalDropReturn {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || !isExternalFileDrag(e)) return;
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || !isExternalFileDrag(e)) return;
    e.dataTransfer.dropEffect = 'copy';
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  }, [disabled]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    if (disabled || !isExternalFileDrag(e)) return;

    const result = await extractFilesFromDataTransfer(e.dataTransfer);
    if (result.files.length > 0) {
      onDrop(result);
    }
  }, [disabled, onDrop]);

  return {
    isDragOver,
    dropHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
