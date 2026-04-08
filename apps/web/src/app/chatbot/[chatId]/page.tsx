'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ChatPanel, ChatEmptyState } from '@xgen/ui';
import type { ChatPanelMessage } from '@xgen/ui';
import {
  getDeployStatusPublic,
  executeAgentflowStream,
} from '@xgen/api-client';
import type { DeployStatus } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  status: 'pending' | 'sent' | 'error' | 'streaming';
  errorMessage?: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const generateMessageId = (): string =>
  `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const generateInteractionId = (workflowId: string, userId: string): string =>
  `deploy_${workflowId}_${userId}_${Date.now()}`;

// ─────────────────────────────────────────────────────────────
// Chatbot Page
// ─────────────────────────────────────────────────────────────

export default function ChatbotPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const chatId = params?.chatId as string;
  const userId = searchParams?.get('userId') || '';

  const abortControllerRef = useRef<AbortController | null>(null);
  const interactionIdRef = useRef<string>('');

  // State
  const [deployStatus, setDeployStatus] = useState<DeployStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Convert to ChatPanelMessage
  const panelMessages: ChatPanelMessage[] = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        createdAt: m.createdAt,
        status: m.status,
        errorMessage: m.errorMessage,
      })),
    [messages],
  );

  // ── Load deploy status ──────────────────────────────────

  useEffect(() => {
    if (!chatId || !userId) {
      setError('Invalid chatbot URL. Missing workflow ID or user ID.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const status = await getDeployStatusPublic(chatId, userId);
        if (!status.is_deployed) {
          setError('This workflow is not currently deployed.');
          setLoading(false);
          return;
        }
        setDeployStatus(status);

        // Generate interaction ID
        interactionIdRef.current = generateInteractionId(chatId, userId);

        // Show welcome message if configured
        const welcomeMessages: ChatMessage[] = [];
        if (status.deploy_start_msg) {
          welcomeMessages.push({
            id: generateMessageId(),
            sender: 'assistant',
            content: status.deploy_start_msg,
            createdAt: new Date().toISOString(),
            status: 'sent',
          });
        }

        // Show suggested replies as system message
        if (status.deploy_msg_selection?.length) {
          welcomeMessages.push({
            id: generateMessageId(),
            sender: 'system',
            content: status.deploy_msg_selection.join(' | '),
            createdAt: new Date().toISOString(),
            status: 'sent',
          });
        }

        setMessages(welcomeMessages);
      } catch (err) {
        console.error('Failed to load deploy status:', err);
        setError('Failed to load chatbot. The workflow may not be deployed.');
      } finally {
        setLoading(false);
      }
    })();
  }, [chatId, userId]);

  // ── Execute workflow (streaming) ────────────────────────

  const executeChat = useCallback(
    async (message: string) => {
      if (!chatId || !userId) return;

      setIsExecuting(true);
      setIsStreaming(true);

      const userMessage: ChatMessage = {
        id: generateMessageId(),
        sender: 'user',
        content: message,
        createdAt: new Date().toISOString(),
        status: 'sent',
      };

      const assistantMessageId = generateMessageId();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        sender: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'streaming',
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      abortControllerRef.current = new AbortController();
      let accumulatedContent = '';

      try {
        await executeAgentflowStream({
          workflowName: deployStatus?.workflow_name || chatId,
          workflowId: chatId,
          inputData: message,
          interactionId: interactionIdRef.current,
          user_id: userId,
          signal: abortControllerRef.current.signal,
          skipAuth: true,
          useDeployEndpoint: true,
          onData: (content) => {
            const text = typeof content === 'string' ? content : JSON.stringify(content);
            accumulatedContent += text;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg,
              ),
            );
          },
          onEnd: () => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, status: 'sent' as const }
                  : msg,
              ),
            );
          },
          onError: (err) => {
            console.error('Agentflow execution failed:', err);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      status: 'error' as const,
                      content: 'An error occurred while processing your request.',
                      errorMessage: String(err),
                    }
                  : msg,
              ),
            );
          },
        });

        if (abortControllerRef.current?.signal.aborted) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content || '(Cancelled)', status: 'sent' as const }
                : msg,
            ),
          );
        }
      } catch (err) {
        console.error('Execution error:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  status: 'error' as const,
                  content: 'An error occurred while processing your request.',
                  errorMessage: (err as Error).message,
                }
              : msg,
          ),
        );
      } finally {
        setIsExecuting(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [chatId, userId, deployStatus?.workflow_name],
  );

  // ── Event handlers ──────────────────────────────────────

  const handleSend = useCallback(
    (text: string) => {
      executeChat(text);
    },
    [executeChat],
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleRetry = useCallback(
    (messageId: string) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx < 0) return;
      const msg = messages[idx];
      if (msg.sender === 'user') {
        setMessages((prev) => prev.slice(0, idx));
        executeChat(msg.content);
      } else if (msg.sender === 'assistant' && idx > 0) {
        const userMsg = messages[idx - 1];
        if (userMsg.sender === 'user') {
          setMessages((prev) => prev.slice(0, idx - 1));
          executeChat(userMsg.content);
        }
      }
    },
    [messages, executeChat],
  );

  // ── Derive theme from deploy settings ───────────────────

  const theme = deployStatus?.deploy_style?.theme || 'light';
  const primaryColor = deployStatus?.deploy_style?.primaryColor || '#305eeb';
  const botName = deployStatus?.deploy_name || deployStatus?.workflow_name || 'AI Assistant';

  // ── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading chatbot...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3 max-w-md text-center px-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Chatbot Unavailable</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen"
      style={{
        '--chatbot-primary': primaryColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0"
        style={{ backgroundColor: theme === 'dark' ? '#1a1a2e' : '#ffffff' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {botName.charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-foreground text-sm">{botName}</span>
      </div>

      {/* Chat */}
      <ChatPanel
        variant="full"
        messages={panelMessages}
        onSend={handleSend}
        onStop={handleStop}
        onRetry={handleRetry}
        isExecuting={isExecuting}
        isStreaming={isStreaming}
        placeholder="Type your message..."
        emptyState={
          <ChatEmptyState
            variant="full"
            title={botName}
            description={deployStatus?.deploy_start_msg || 'How can I help you today?'}
          />
        }
      />
    </div>
  );
}
