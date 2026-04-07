'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────
// ConfigCard — 시스템 설정 항목 표시/편집 카드
//
// 좌측 accent bar + 아이콘 · 이름 · 경로 · 값(현재/기본) · 인라인 편집
// ─────────────────────────────────────────────────────────────

/* ── Types ── */

export type ConfigValueType = 'Str' | 'Num' | 'Bool' | 'Array' | 'Unknown';

export interface ConfigCardProps {
  /** 환경 변수 이름 (ex: ANTHROPIC_API_KEY) */
  envName: string;
  /** 설정 경로 (ex: anthropic.api_key) */
  configPath: string;
  /** 현재 값 (포맷팅된 문자열) */
  currentValue: string;
  /** 기본값 (포맷팅된 문자열) */
  defaultValue: string;
  /** 값 타입 */
  valueType: ConfigValueType;
  /** 기본값과 다르게 설정된 상태인지 */
  isModified: boolean;
  /** 카테고리 아이콘 */
  icon?: React.ReactNode;
  /** 카테고리 accent 색상 (hex) */
  accentColor?: string;
  /** 상태 라벨: 설정됨/기본값 */
  statusLabel: string;
  /** 현재 값 라벨 */
  currentValueLabel: string;
  /** 기본값 라벨 */
  defaultValueLabel: string;
  /** 편집 시작 시 사용할 raw 값 */
  rawEditValue?: string;

  /** 편집 모드 */
  editing?: boolean;
  /** 편집 중 값 */
  editValue?: string;
  /** 저장 중 상태 */
  saving?: boolean;

  /** 편집 시작 */
  onEditStart?: () => void;
  /** 편집 값 변경 */
  onEditChange?: (value: string) => void;
  /** 저장 */
  onSave?: () => void;
  /** 취소 */
  onCancel?: () => void;

  className?: string;
}

/* ── Subcomponents ── */

const TypeBadge: React.FC<{ type: ConfigValueType }> = ({ type }) => {
  const colorMap: Record<ConfigValueType, string> = {
    Str: 'bg-blue-50 text-blue-600 border-blue-200',
    Num: 'bg-amber-50 text-amber-600 border-amber-200',
    Bool: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Array: 'bg-violet-50 text-violet-600 border-violet-200',
    Unknown: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold tracking-wide border',
      colorMap[type],
    )}>
      {type}
    </span>
  );
};

const StatusBadge: React.FC<{ label: string; isModified: boolean }> = ({ label, isModified }) => (
  <span className={cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
    isModified
      ? 'bg-primary/5 text-primary border-primary/20'
      : 'bg-gray-50 text-gray-500 border-gray-200',
  )}>
    <span className={cn(
      'w-1.5 h-1.5 rounded-full',
      isModified ? 'bg-primary' : 'bg-gray-300',
    )} />
    {label}
  </span>
);

/* ── Icons ── */

const EditIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ── Main Component ── */

export const ConfigCard: React.FC<ConfigCardProps> = ({
  envName,
  configPath,
  currentValue,
  defaultValue,
  valueType,
  isModified,
  icon,
  accentColor = '#6b7280',
  statusLabel,
  currentValueLabel,
  defaultValueLabel,
  editing = false,
  editValue = '',
  saving = false,
  onEditStart,
  onEditChange,
  onSave,
  onCancel,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onSave?.(); }
    else if (e.key === 'Escape') { e.preventDefault(); onCancel?.(); }
  };

  return (
    <div
      className={cn(
        'group relative flex rounded-xl border border-[var(--color-line-50)] bg-card overflow-hidden transition-all duration-150',
        'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-gray-300',
        editing && 'ring-1 ring-primary/30 border-primary/40 shadow-[0_2px_12px_rgba(0,0,0,0.08)]',
        className,
      )}
    >
      {/* ── Left accent bar ── */}
      <div
        className="w-1 shrink-0 rounded-l-xl"
        style={{ backgroundColor: accentColor }}
      />

      {/* ── Card body ── */}
      <div className="flex-1 min-w-0 px-4 py-3.5">
        {/* Row 1: Icon + Name + Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-[13px] font-semibold text-foreground truncate leading-tight">
                {envName}
              </h4>
              <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 font-mono">
                {configPath}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge label={statusLabel} isModified={isModified} />
            <TypeBadge type={valueType} />
          </div>
        </div>

        {/* Row 2: Values */}
        <div className="mt-3 rounded-lg bg-[#f8f9fb] border border-[var(--color-line-50)] px-3.5 py-2.5">
          {editing ? (
            /* ── Edit mode ── */
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {currentValueLabel}
              </span>
              {valueType === 'Bool' ? (
                <select
                  ref={inputRef as React.RefObject<HTMLSelectElement>}
                  value={editValue}
                  onChange={(e) => onEditChange?.(e.target.value)}
                  disabled={saving}
                  onKeyDown={handleKeyDown}
                  className="flex-1 rounded-md border border-primary/30 bg-white px-2.5 py-1.5 text-sm text-foreground font-mono focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type={valueType === 'Num' ? 'number' : 'text'}
                  value={editValue}
                  onChange={(e) => onEditChange?.(e.target.value)}
                  disabled={saving}
                  onKeyDown={handleKeyDown}
                  className="flex-1 rounded-md border border-primary/30 bg-white px-2.5 py-1.5 text-sm text-foreground font-mono focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
                />
              )}
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
                  'bg-primary text-white hover:bg-primary/90',
                  saving && 'opacity-50 cursor-not-allowed',
                )}
                title="Save (Enter)"
              >
                <CheckIcon />
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-gray-200 transition-colors"
                title="Cancel (Esc)"
              >
                <XIcon />
              </button>
            </div>
          ) : (
            /* ── View mode ── */
            <>
              <div className="flex items-center gap-2 group/row">
                <span className="shrink-0 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {currentValueLabel}
                </span>
                <span className={cn(
                  'flex-1 font-mono text-[13px] truncate',
                  isModified ? 'text-foreground font-medium' : 'text-foreground/80',
                )}>
                  {currentValue || <span className="text-muted-foreground/40 italic">empty</span>}
                </span>
                {onEditStart && (
                  <button
                    type="button"
                    onClick={onEditStart}
                    className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground/50 opacity-0 group-hover/row:opacity-100 hover:text-foreground hover:bg-white transition-all"
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-dashed border-gray-200">
                <span className="shrink-0 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  {defaultValueLabel}
                </span>
                <span className="flex-1 font-mono text-[12px] text-muted-foreground/60 truncate">
                  {defaultValue || <span className="italic">empty</span>}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigCard;
