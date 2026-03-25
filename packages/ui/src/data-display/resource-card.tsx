'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type {
  ResourceCardProps,
  CardBadge,
  CardMetaItem,
  CardActionButton,
  CardDropdownItem,
  CardThumbnail,
} from '@xgen/types';
import styles from './resource-card.module.scss';

// 기본 아이콘 (FiMoreVertical 대체)
const MoreIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="8" cy="3" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="13" r="1.5" fill="currentColor" />
  </svg>
);

// 기본 폴더 아이콘
const FolderIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V7.5C17.5 6.57953 16.7538 5.83333 15.8333 5.83333H10L8.33333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * ResourceCard - 리소스(워크플로우, 프롬프트, 컬렉션 등) 표시용 범용 카드 컴포넌트
 *
 * xgen-frontend의 카드 디자인 패턴을 따르며, 다음 기능을 지원:
 * - 다중 상태 배지 (LIVE, MY, CLOSE 등)
 * - 메타데이터 표시 (작성자, 날짜, 노드 수 등)
 * - 기본 액션 버튼 (실행, 편집, 복사)
 * - 드롭다운 메뉴 (설정, 버전, 삭제 등)
 * - 선택/다중 선택 모드
 * - 비활성(unactive) 상태
 *
 * @example
 * ```tsx
 * <ResourceCard
 *   id="workflow-1"
 *   data={workflow}
 *   title={workflow.name}
 *   description={workflow.description}
 *   badges={[
 *     { text: 'LIVE', variant: 'success' },
 *     { text: 'MY', variant: 'secondary' },
 *   ]}
 *   metadata={[
 *     { icon: <FiUser />, value: workflow.author },
 *     { icon: <FiClock />, value: '2026.01.28' },
 *   ]}
 *   primaryActions={[
 *     { id: 'execute', icon: <FiPlay />, label: '실행', onClick: handleExecute },
 *     { id: 'edit', icon: <FiEdit />, label: '편집', onClick: handleEdit },
 *   ]}
 *   dropdownActions={[
 *     { id: 'settings', icon: <FiSettings />, label: '설정', onClick: handleSettings },
 *     { id: 'delete', icon: <FiTrash />, label: '삭제', onClick: handleDelete, danger: true },
 *   ]}
 *   onClick={handleCardClick}
 * />
 * ```
 */
export function ResourceCard<T = unknown>({
  id,
  data,
  title,
  description,
  errorMessage,
  thumbnail,
  badges,
  metadata,
  primaryActions,
  dropdownActions,
  selectable,
  selected,
  onClick,
  onDoubleClick,
  onSelect,
  inactive,
  inactiveMessage,
  className,
}: ResourceCardProps<T>): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  // 카드 클릭 핸들러
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // 액션 버튼이나 드롭다운 클릭 시 무시
      const target = e.target as HTMLElement;
      if (
        target.closest(`.${styles.cardActions}`) ||
        target.closest(`.${styles.checkbox}`)
      ) {
        return;
      }

      if (selectable && onSelect) {
        onSelect(id, !selected);
      } else if (onClick) {
        onClick(data);
      }
    },
    [id, data, selectable, selected, onClick, onSelect]
  );

  // 카드 더블클릭 핸들러
  const handleCardDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (inactive) return;
      if (selectable) return; // 다중 선택 모드에서는 더블클릭 무시

      const target = e.target as HTMLElement;
      if (target.closest(`.${styles.cardActions}`)) return;

      if (onDoubleClick) {
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick(data);
      }
    },
    [data, inactive, selectable, onDoubleClick]
  );

  // 액션 버튼 클릭 핸들러
  const handleActionClick = useCallback(
    (action: CardActionButton, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!action.disabled) {
        action.onClick();
      }
    },
    []
  );

  // 드롭다운 아이템 클릭 핸들러
  const handleDropdownItemClick = useCallback(
    (item: CardDropdownItem, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!item.disabled) {
        item.onClick();
        setMenuOpen(false);
      }
    },
    []
  );

  // 썸네일 렌더링
  const renderThumbnail = () => {
    if (!thumbnail) {
      // 기본 폴더 아이콘
      return (
        <div className={styles.thumbnail}>
          <FolderIcon />
        </div>
      );
    }

    const style: React.CSSProperties = {};
    if (thumbnail.backgroundColor) {
      style['--thumbnail-bg' as string] = thumbnail.backgroundColor;
    }
    if (thumbnail.iconColor) {
      style['--thumbnail-icon-color' as string] = thumbnail.iconColor;
    }

    return (
      <div
        className={`${styles.thumbnail} ${thumbnail.backgroundColor || thumbnail.iconColor ? styles.customBg : ''}`}
        style={style}
      >
        {thumbnail.imageUrl ? (
          <img src={thumbnail.imageUrl} alt={title} />
        ) : thumbnail.icon ? (
          thumbnail.icon
        ) : (
          <FolderIcon />
        )}
      </div>
    );
  };

  // 배지 렌더링
  const renderBadges = () => {
    if (!badges || badges.length === 0) return null;

    return (
      <div className={styles.badgeContainer}>
        {badges.map((badge, index) => (
          <span
            key={`${badge.text}-${index}`}
            className={`${styles.badge} ${styles[badge.variant]}`}
            title={badge.tooltip}
          >
            {badge.text}
          </span>
        ))}
      </div>
    );
  };

  // 메타데이터 렌더링
  const renderMetadata = () => {
    if (!metadata || metadata.length === 0) return null;

    return (
      <div className={styles.metadata}>
        {metadata.map((meta, index) => (
          <div
            key={index}
            className={styles.metaItem}
            title={meta.tooltip || String(meta.value)}
          >
            {meta.icon}
            {meta.label && <span>{meta.label}:</span>}
            <span>{meta.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // 액션 버튼들 렌더링
  const renderActions = () => {
    if (inactive) {
      return (
        <div className={styles.cardActions}>
          <div className={styles.inactiveMessage}>
            {inactiveMessage || '비활성 상태'}
          </div>
        </div>
      );
    }

    const hasPrimaryActions = primaryActions && primaryActions.length > 0;
    const hasDropdownActions = dropdownActions && dropdownActions.length > 0;

    if (!hasPrimaryActions && !hasDropdownActions) return null;

    return (
      <div className={styles.cardActions}>
        {/* 좌측 기본 액션 버튼들 */}
        <div className={styles.actionsLeft}>
          {primaryActions?.map((action) => (
            <button
              key={action.id}
              className={styles.actionButton}
              title={action.disabled ? action.disabledMessage : action.label}
              disabled={action.disabled}
              onClick={(e) => handleActionClick(action, e)}
            >
              {action.icon}
            </button>
          ))}
        </div>

        {/* 우측 드롭다운 메뉴 */}
        <div className={styles.actionsRight}>
          {hasDropdownActions && (
            <div
              ref={dropdownRef}
              className={`${styles.dropdownContainer} ${menuOpen ? styles.dropdownActive : ''}`}
            >
              <button
                className={styles.dropdownTrigger}
                title="더보기"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
              >
                <MoreIcon />
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
                  <div className={styles.dropdownMenu}>
                    {dropdownActions.map((item, index) => (
                      <React.Fragment key={item.id}>
                        {item.dividerBefore && index > 0 && (
                          <div className={styles.dropdownDivider} />
                        )}
                        <button
                          className={`${styles.dropdownItem} ${item.danger ? styles.danger : ''}`}
                          disabled={item.disabled}
                          onClick={(e) => handleDropdownItemClick(item, e)}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const isClickable = onClick || (selectable && onSelect);

  return (
    <div
      className={`
        ${styles.card}
        ${selected ? styles.selected : ''}
        ${isClickable ? styles.clickable : ''}
        ${inactive ? styles.inactive : ''}
        ${menuOpen ? styles.menuOpen : ''}
        ${className || ''}
      `.trim()}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      data-card-id={id}
    >
      {/* 선택 체크박스 */}
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

      {/* 헤더: 썸네일 + 배지 */}
      <div className={styles.cardHeader}>
        {renderThumbnail()}
        {renderBadges()}
      </div>

      {/* 콘텐츠: 제목, 설명, 메타데이터 */}
      <div className={styles.cardContent}>
        <h3 className={styles.title} title={title}>
          {title}
        </h3>

        {description && (
          <p className={styles.description}>{description}</p>
        )}

        {errorMessage && (
          <p className={styles.errorMessage}>오류: {errorMessage}</p>
        )}

        {renderMetadata()}
      </div>

      {/* 액션 버튼들 */}
      {renderActions()}
    </div>
  );
}

export default ResourceCard;

// Re-export types for convenience
export type {
  ResourceCardProps,
  CardBadge,
  CardMetaItem,
  CardActionButton,
  CardDropdownItem,
  CardThumbnail,
} from '@xgen/types';
