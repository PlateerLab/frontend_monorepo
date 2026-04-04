import React, { useMemo, useCallback } from 'react';
import { useTranslation } from '@xgen/i18n';
import { ChatPanel } from '@xgen/ui';
import type { ChatPanelMessage } from '@xgen/ui';
import { useBottomPanel } from '../context/BottomPanelContext';

const ChatTab: React.FC = () => {
    const { t } = useTranslation();
    const {
        chatMessages,
        isExecuting,
        sendChatMessage,
    } = useBottomPanel();

    // Map local ChatMessage (id:number, role, content, timestamp) → ChatPanelMessage
    const panelMessages: ChatPanelMessage[] = useMemo(
        () =>
            chatMessages.map((msg) => ({
                id: String(msg.id),
                sender: msg.role as ChatPanelMessage['sender'],
                content: msg.content,
                createdAt: new Date(msg.timestamp).toISOString(),
                status: (!msg.content && msg.role === 'assistant' && isExecuting
                    ? 'streaming'
                    : 'sent') as ChatPanelMessage['status'],
            })),
        [chatMessages, isExecuting],
    );

    const handleSend = useCallback(
        (text: string) => { sendChatMessage(text); },
        [sendChatMessage],
    );

    return (
        <ChatPanel
            messages={panelMessages}
            onSend={handleSend}
            isExecuting={isExecuting}
            isStreaming={isExecuting}
            variant="compact"
            placeholder={t('canvas.bottomPanel.chat.inputHint')}
            sendLabel={t('canvas.bottomPanel.chat.send')}
        />
    );
};

export default ChatTab;
