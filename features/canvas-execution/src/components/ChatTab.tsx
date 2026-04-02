import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@xgen/i18n';
import { LuSend } from '@xgen/icons';
import { cn } from '@xgen/ui';
import { useBottomPanel } from '../context/BottomPanelContext';

const ChatTab: React.FC = () => {
    const { t } = useTranslation();
    const {
        chatMessages,
        chatInput,
        isExecuting,
        sendChatMessage,
        setChatInput,
    } = useBottomPanel();

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage(chatInput);
        }
    }, [chatInput, sendChatMessage]);

    const handleSend = useCallback(() => {
        sendChatMessage(chatInput);
    }, [chatInput, sendChatMessage]);

    return (
        <>
            <div className="flex-1 overflow-y-auto py-3 px-4 flex flex-col gap-2 text-xs font-normal leading-4 text-[#40444d]" ref={scrollRef}>
                {chatMessages.length === 0 ? (
                    <span className="text-[#7a7f89]">
                        {t('canvas.bottomPanel.chat.placeholder')}
                    </span>
                ) : (
                    chatMessages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                'max-w-[85%] py-2 px-3 rounded-[10px] break-words',
                                msg.role === 'user'
                                    ? 'self-end bg-primary text-white rounded-br-sm'
                                    : 'self-start bg-gray-100 text-[#40444d] rounded-bl-sm',
                            )}
                        >
                            {msg.role === 'assistant' && !msg.content && isExecuting ? (
                                <div className="flex gap-1 py-1 [&_span]:w-1.5 [&_span]:h-1.5 [&_span]:rounded-full [&_span]:bg-gray-400 [&_span]:animate-[bouncing-dots_1.2s_infinite] [&_span:nth-child(2)]:delay-200 [&_span:nth-child(3)]:delay-[400ms]">
                                    <span /><span /><span />
                                </div>
                            ) : (
                                <pre className="m-0 whitespace-pre-wrap break-words text-xs leading-[18px]">{msg.content}</pre>
                            )}
                        </div>
                    ))
                )}
            </div>
            <div className="flex items-end gap-1.5 py-2 px-3 border-t border-black/[0.08] bg-[#fafbfc] shrink-0">
                <textarea
                    className="flex-1 py-1.5 px-2.5 border border-gray-300 rounded-lg text-xs leading-[18px] text-[#40444d] bg-white resize-none min-h-[30px] max-h-[60px] outline-none transition-[border-color] duration-150 focus:border-primary focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)] placeholder:text-gray-400 disabled:opacity-50"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('canvas.bottomPanel.chat.inputHint')}
                    disabled={isExecuting}
                    rows={1}
                />
                <button
                    className="flex items-center justify-center w-[30px] h-[30px] border-none rounded-lg bg-primary text-white cursor-pointer shrink-0 transition-[background] duration-150 hover:enabled:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:w-3.5 [&_svg]:h-3.5"
                    onClick={handleSend}
                    disabled={isExecuting || !chatInput.trim()}
                    title={t('canvas.bottomPanel.chat.send')}
                    type="button"
                >
                    <LuSend />
                </button>
            </div>
        </>
    );
};

export default ChatTab;
