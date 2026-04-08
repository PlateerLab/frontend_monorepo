export const ko: Record<string, unknown> = {
  // ── Bottom Panel (Header) ────────────────────────────────────
  bottomPanel: {
    execution: 'Execution',
    log: '로그',
    clear: '지우기',
    fullscreen: '전체 화면',
    exitFullscreen: '전체 화면 종료',
    expand: '펼치기',
    collapse: '접기',
    resizeHint: '드래그하여 높이 조절',

    // ── Chat Tab ───────────────────────────────────────────────
    chat: {
      title: 'Chat',
      placeholder: '메시지를 입력하여 에이전트플로우를 실행하세요.',
      inputHint: '메시지를 입력하세요...',
      send: '보내기',
    },

    // ── Executor Tab ───────────────────────────────────────────
    executor: {
      title: 'Executor',
      placeholder: "'실행'을 클릭하여 에이전트플로우를 실행하세요.",
      running: '실행 중...',
    },

    // ── Execution Order Column ─────────────────────────────────
    order: {
      title: 'Execution Order',
      empty: '실행 순서 데이터가 없습니다.',
      loading: '로딩 중...',
      running: '실행 중',
      completed: '완료',
      failed: '실패',
      bypassed: '바이패스',
    },

    // ── Log Column ─────────────────────────────────────────────
    logViewer: {
      search: '로그 검색',
      noMatch: '검색 결과 없음',
      autoScroll: '자동 스크롤',
      showDebug: '디버그 표시',
      showTools: '도구 표시',
      filterAriaLabel: '로그 필터 (디버그 / 도구 표시)',
      noLogs: '로그가 없습니다.',
      toolCall: '도구 호출',
      toolResult: '도구 결과',
      toolError: '도구 오류',
      inputLabel: '입력',
      resultLabel: '결과',
      resultLengthChars: '{{count}}자',
      citationsLabel: '인용',
      errorLabel: '오류',
      unknownError: '알 수 없는 오류',
    },
  },

  // ── Legacy keys (backward compat — will be removed) ──────────
  executionPanel: {
    title: '실행',
    placeholder: "'실행'을 클릭하여 에이전트플로우를 실행하세요.",
    chatPlaceholder: '메시지를 입력하여 에이전트플로우를 실행하세요.',
    chatInputPlaceholder: '메시지를 입력하세요...',
    send: '보내기',
    tabChat: 'Chat',
    tabExecutor: 'Executor',
    executionFailed: '실행 실패',
    unexpectedFormat: '예상치 못한 출력 형식입니다.',
    clearOutput: '출력 지우기',
    copyOutput: '출력 복사',
    copied: '복사됨!',
    runAgentflow: '에이전트플로우 실행',
    saveAndRun: '저장 및 실행',
  },
  detailPanel: {
    log: '로그',
    noExecutionOrderData: '실행 순서 데이터가 없습니다.',
    applyLayout: '정렬 적용',
    applyLayoutTooltip: '정렬된 실행 순서대로 노드를 배치합니다',
    graph: '그래프',
    detail: '상세',
  },
  bottom: {
    execution: 'Execution',
    log: '로그',
    clear: '지우기',
    fullscreen: '전체 화면',
    expand: '펼치기',
    collapse: '접기',
  },
  logViewer: {
    showDebug: '디버그 표시',
    showTools: '도구 표시',
    filterAriaLabel: '로그 필터 (디버그 / 도구 표시)',
    noLogs: '로그가 없습니다.',
    toolCall: '도구 호출',
    toolResult: '도구 결과',
    toolError: '도구 오류',
    inputLabel: '입력',
    resultLabel: '결과',
    resultLengthChars: '{{count}}자',
    citationsLabel: '인용',
    errorLabel: '오류',
    unknownError: '알 수 없는 오류',
  },
};
