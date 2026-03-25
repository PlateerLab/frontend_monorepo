'use client';

import React from 'react';
import styles from './empty-state.module.scss';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export interface EmptyStateProps {
  /** 아이콘 */
  icon?: React.ReactNode;
  /** 제목 */
  title: string;
  /** 설명 */
  description?: string;
  /** 액션 버튼 */
  action?: EmptyStateAction;
  /** 추천 항목 */
  suggestions?: string[];
  /** 추천 항목 클릭 콜백 */
  onSuggestionClick?: (text: string) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * EmptyState - 빈 상태 표시 컴포넌트
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FiMessageCircle size={48} />}
 *   title="대화를 시작해보세요"
 *   description="AI와 대화하여 업무를 자동화할 수 있습니다."
 *   action={{
 *     label: '새 대화 시작',
 *     onClick: handleNewChat,
 *     icon: <FiPlus />,
 *   }}
 *   suggestions={['오늘 일정 알려줘', '이메일 요약해줘']}
 *   onSuggestionClick={handleSuggestionClick}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  suggestions,
  onSuggestionClick,
  className,
}) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <button
          type="button"
          className={`${styles.actionButton} ${styles[action.variant || 'primary']}`}
          onClick={action.onClick}
        >
          {action.icon && <span className={styles.actionIcon}>{action.icon}</span>}
          {action.label}
        </button>
      )}
      {suggestions && suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((text, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.suggestionChip}
              onClick={() => onSuggestionClick?.(text)}
            >
              {text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
