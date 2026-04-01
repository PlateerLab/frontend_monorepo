'use client';

import React, { useState } from 'react';
import styles from './card.module.scss';

export interface CardMetadata {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}

export interface CardAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface CardBadge {
  text: string;
  variant: BadgeVariant;
}

export interface CardProps {
  /** 카드 ID */
  id: string;
  /** 카드 제목 */
  title: string;
  /** 카드 설명 */
  description?: string;
  /** 썸네일 (이미지 URL 또는 컴포넌트) */
  thumbnail?: string | React.ReactNode;
  /** 메타데이터 목록 */
  metadata?: CardMetadata[];
  /** 상태 배지 */
  badge?: CardBadge;
  /** 드롭다운 메뉴 액션 */
  actions?: CardAction[];
  /** 선택 가능 여부 */
  selectable?: boolean;
  /** 선택 상태 */
  selected?: boolean;
  /** 카드 클릭 콜백 */
  onClick?: () => void;
  /** 선택 변경 콜백 */
  onSelect?: (id: string, selected: boolean) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * Card - 범용 카드 컴포넌트
 *
 * @example
 * ```tsx
 * <Card
 *   id="workflow-1"
 *   title="이커머스 법률챗"
 *   description="고객 법률 상담 워크플로우"
 *   metadata={[
 *     { icon: <FiClock />, label: '수정일', value: '2025.01.28' },
 *     { icon: <FiPlay />, label: '실행', value: 1234 },
 *   ]}
 *   badge={{ text: 'Active', variant: 'success' }}
 *   actions={[
 *     { id: 'edit', label: '수정', onClick: handleEdit },
 *     { id: 'delete', label: '삭제', onClick: handleDelete, danger: true },
 *   ]}
 *   onClick={() => handleOpenDetail(workflow)}
 * />
 * ```
 */
export const Card: React.FC<CardProps> = ({
  id,
  title,
  description,
  thumbnail,
  metadata,
  badge,
  actions,
  selectable,
  selected,
  onClick,
  onSelect,
  className,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // 메뉴 버튼이나 체크박스 클릭 시 카드 클릭 무시
    if ((e.target as HTMLElement).closest(`.${styles.moreButton}`) ||
        (e.target as HTMLElement).closest(`.${styles.checkbox}`)) {
      return;
    }

    if (selectable && onSelect) {
      onSelect(id, !selected);
    } else if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (action: CardAction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!action.disabled) {
      action.onClick();
      setMenuOpen(false);
    }
  };

  const isClickable = onClick || (selectable && onSelect);

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''} ${isClickable ? styles.clickable : ''} ${className || ''}`}
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className={styles.thumbnail}>
          {typeof thumbnail === 'string' ? (
            <img src={thumbnail} alt={title} />
          ) : (
            thumbnail
          )}
        </div>
      )}

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {badge && (
            <span className={`${styles.badge} ${styles[badge.variant]}`}>
              {badge.text}
            </span>
          )}
        </div>
        {description && <p className={styles.description}>{description}</p>}
        {metadata && metadata.length > 0 && (
          <div className={styles.metadata}>
            {metadata.map((meta, idx) => (
              <div key={idx} className={styles.metaItem}>
                {meta.icon && <span className={styles.metaIcon}>{meta.icon}</span>}
                <span className={styles.metaLabel}>{meta.label}:</span>
                <span className={styles.metaValue}>{meta.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions Dropdown */}
      {actions && actions.length > 0 && (
        <div className={styles.actionsContainer}>
          <button
            type="button"
            className={styles.moreButton}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="더보기"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div
                className={styles.menuOverlay}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className={styles.menu}>
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className={`${styles.menuItem} ${action.danger ? styles.danger : ''} ${action.disabled ? styles.disabled : ''}`}
                    onClick={(e) => handleActionClick(action, e)}
                    disabled={action.disabled}
                  >
                    {action.icon && <span className={styles.menuIcon}>{action.icon}</span>}
                    {action.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Selection Checkbox */}
      {selectable && (
        <div className={styles.checkbox}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(id, !selected)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Card;
