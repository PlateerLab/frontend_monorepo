'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from '@xgen/i18n';
import type { TeamsAgent } from '../../types';
import styles from './ChatRoom.module.scss';

interface ChatInputProps {
  agents: TeamsAgent[];
  isExecuting: boolean;
  onSend: (content: string, mentionedAgentIds?: string[]) => void;
  onStop: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ agents, isExecuting, onSend, onStop }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  // 드롭다운으로 선택한 멘션 agent ID 추적 (이름에 공백/특수문자가 있어도 안전)
  const [selectedMentionIds, setSelectedMentionIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // @mention 후보 필터링
  const mentionCandidates = useMemo(
    () =>
      agents.filter((a) =>
        a.name.toLowerCase().includes(mentionQuery.toLowerCase())
      ),
    [agents, mentionQuery]
  );

  // textarea 자동 높이 조절
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  // @mention 감지
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setText(val);

      const cursorPos = e.target.selectionStart;
      const beforeCursor = val.substring(0, cursorPos);
      const mentionMatch = beforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        setShowMentions(true);
        setMentionQuery(mentionMatch[1]);
        setMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    },
    []
  );

  // mention 선택
  const insertMention = useCallback(
    (agent: TeamsAgent) => {
      const el = textareaRef.current;
      if (!el) return;

      const cursorPos = el.selectionStart;
      const beforeCursor = text.substring(0, cursorPos);
      const afterCursor = text.substring(cursorPos);
      const mentionStart = beforeCursor.lastIndexOf('@');

      const newText = beforeCursor.substring(0, mentionStart) + `@${agent.name} ` + afterCursor;
      setText(newText);
      setShowMentions(false);
      setSelectedMentionIds((prev) =>
        prev.includes(agent.id) ? prev : [...prev, agent.id]
      );

      requestAnimationFrame(() => {
        const newPos = mentionStart + agent.name.length + 2;
        el.setSelectionRange(newPos, newPos);
        el.focus();
      });
    },
    [text]
  );

  // 전송
  const handleSend = useCallback(() => {
    if (!text.trim() || isExecuting) return;

    // 드롭다운으로 선택된 멘션 ID 중 현재 본문에 이름이 남아있는 것만 유효
    // (사용자가 backspace 등으로 멘션을 지웠을 수 있음)
    const validIds = selectedMentionIds.filter((id) => {
      const agent = agents.find((a) => a.id === id);
      return agent ? text.includes(`@${agent.name}`) : false;
    });

    onSend(text.trim(), validIds.length > 0 ? validIds : undefined);
    setText('');
    setShowMentions(false);
    setSelectedMentionIds([]);
  }, [text, isExecuting, agents, onSend, selectedMentionIds]);

  // 키보드 핸들링
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showMentions && mentionCandidates.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionIndex((prev) => (prev + 1) % mentionCandidates.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionIndex((prev) => (prev - 1 + mentionCandidates.length) % mentionCandidates.length);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          insertMention(mentionCandidates[mentionIndex]);
          return;
        }
        if (e.key === 'Escape') {
          setShowMentions(false);
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [showMentions, mentionCandidates, mentionIndex, insertMention, handleSend]
  );

  return (
    <div className={styles.chatInput}>
      <div className={styles.inputWrapper}>
        {/* Mention Autocomplete */}
        {showMentions && mentionCandidates.length > 0 && (
          <div className={styles.mentionList}>
            {mentionCandidates.map((agent, i) => (
              <button
                key={agent.id}
                className={`${styles.mentionItem} ${i === mentionIndex ? styles.mentionItemActive : ''}`}
                onClick={() => insertMention(agent)}
              >
                <span className={styles.mentionDot} style={{ background: agent.color }} />
                <span className={styles.mentionName}>{agent.name}</span>
                {agent.description && (
                  <span className={styles.mentionDesc}>{agent.description}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t('teams.chat.inputPlaceholder')}
          rows={1}
          disabled={isExecuting}
        />
      </div>

      {isExecuting ? (
        <button className={styles.stopBtn} onClick={onStop} title={t('teams.chat.stop')}>
          <svg viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10" rx="2" />
          </svg>
        </button>
      ) : (
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!text.trim()}
          title={t('teams.chat.send')}
        >
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16.5 1.5L8.25 9.75" />
            <path d="M16.5 1.5L11.25 16.5L8.25 9.75L1.5 6.75L16.5 1.5Z" />
          </svg>
        </button>
      )}
    </div>
  );
};
