// ============================================================
// @xgen/ui — Chat Components
//
// Shared chat interface used across:
// - main-chat-current (full-page)
// - canvas-execution ChatTab (compact, embedded in bottom panel)
// - Deploy/Embed chat (full, with custom theming — future)
// ============================================================

export { ChatPanel } from './chat-panel';
export { ChatMessageList } from './chat-message-list';
export { ChatMessageItem } from './chat-message-item';
export { ChatInput } from './chat-input';
export { ChatEmptyState } from './chat-empty-state';
export { ChatTypingIndicator } from './chat-typing-indicator';

// Icons (for consumer features that compose their own headers)
export {
  UserIcon as ChatUserIcon,
  BotIcon as ChatBotIcon,
  SendIcon as ChatSendIcon,
  ChatBubbleIcon,
} from './chat-icons';

// Types
export type {
  ChatPanelProps,
  ChatPanelMessage,
  ChatPanelSender,
  ChatPanelMessageStatus,
  ChatPanelAttachment,
  ChatPanelVariant,
  ChatMessageItemProps,
  ChatMessageListProps,
  ChatInputProps,
  ChatEmptyStateProps,
  ChatTypingIndicatorProps,
} from './types';
