import type { ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────
// Message Types (generic — not tied to @xgen/types)
// ─────────────────────────────────────────────────────────────

/** Message sender */
export type ChatPanelSender = 'user' | 'assistant' | 'system';

/** Message status for UI rendering */
export type ChatPanelMessageStatus = 'pending' | 'sent' | 'error' | 'streaming';

/** Attachment info for display only */
export interface ChatPanelAttachment {
  id: string;
  name: string;
  type?: string;
  size?: number;
}

/** A single message to render in the chat panel */
export interface ChatPanelMessage {
  id: string;
  sender: ChatPanelSender;
  content: string;
  createdAt?: string;
  status?: ChatPanelMessageStatus;
  attachments?: ChatPanelAttachment[];
  errorMessage?: string;
}

// ─────────────────────────────────────────────────────────────
// Variant
// ─────────────────────────────────────────────────────────────

/**
 * - `full`: Full-page chat (avatars, timestamps, padding 1.5rem, large text)
 * - `compact`: Embedded mini-chat in panel (no avatars, no timestamps, smaller text, tighter padding)
 */
export type ChatPanelVariant = 'full' | 'compact';

// ─────────────────────────────────────────────────────────────
// ChatPanel Props
// ─────────────────────────────────────────────────────────────

export interface ChatPanelProps {
  /** Messages to render */
  messages: ChatPanelMessage[];

  /** Called when user sends a message */
  onSend: (text: string) => void;

  /** Called when user clicks stop during execution */
  onStop?: () => void;

  /** Whether an execution/streaming is in progress */
  isExecuting?: boolean;

  /** Whether the assistant is actively streaming content */
  isStreaming?: boolean;

  /** Variant: 'full' (page) or 'compact' (embedded panel) */
  variant?: ChatPanelVariant;

  /** Placeholder text for the input area */
  placeholder?: string;

  /** Custom empty state element (replaces default) */
  emptyState?: ReactNode;

  /** Show attachment button and support file uploads */
  showAttachments?: boolean;

  /** Called when files are selected */
  onAttach?: (files: File[]) => void;

  /** Pending attachment files (for display in input area) */
  attachments?: File[];

  /** Called to remove a pending attachment by index */
  onRemoveAttachment?: (index: number) => void;

  /** Called when retry is clicked on an error message */
  onRetry?: (messageId: string) => void;

  /** Extra class name for the root container */
  className?: string;

  /** Override send button label (default: tooltip only) */
  sendLabel?: string;

  /** Override stop button label */
  stopLabel?: string;

  /** Retry button label */
  retryLabel?: string;

  /** Error text for failed messages */
  errorLabel?: string;
}

// ─────────────────────────────────────────────────────────────
// Sub-component Props
// ─────────────────────────────────────────────────────────────

export interface ChatMessageItemProps {
  message: ChatPanelMessage;
  variant: ChatPanelVariant;
  onRetry?: () => void;
  retryLabel?: string;
  errorLabel?: string;
}

export interface ChatMessageListProps {
  messages: ChatPanelMessage[];
  variant: ChatPanelVariant;
  isExecuting?: boolean;
  isStreaming?: boolean;
  onRetry?: (messageId: string) => void;
  retryLabel?: string;
  errorLabel?: string;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isExecuting?: boolean;
  variant: ChatPanelVariant;
  placeholder?: string;
  showAttachments?: boolean;
  onAttach?: (files: File[]) => void;
  attachments?: File[];
  onRemoveAttachment?: (index: number) => void;
  sendLabel?: string;
  stopLabel?: string;
}

export interface ChatEmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  suggestions?: Array<{ key: string; label: string }>;
  onSuggestionClick?: (label: string) => void;
  variant: ChatPanelVariant;
}

export interface ChatTypingIndicatorProps {
  variant: ChatPanelVariant;
}
