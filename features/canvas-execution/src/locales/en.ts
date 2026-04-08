export const en: Record<string, unknown> = {
  // ── Bottom Panel (Header) ────────────────────────────────────
  bottomPanel: {
    execution: 'Execution',
    log: 'Log',
    clear: 'Clear',
    fullscreen: 'Full screen',
    exitFullscreen: 'Exit full screen',
    expand: 'Expand',
    collapse: 'Collapse',
    resizeHint: 'Drag to resize',

    // ── Chat Tab ───────────────────────────────────────────────
    chat: {
      title: 'Chat',
      placeholder: 'Enter a message to run the workflow.',
      inputHint: 'Type a message...',
      send: 'Send',
    },

    // ── Executor Tab ───────────────────────────────────────────
    executor: {
      title: 'Executor',
      placeholder: "Click 'Run' to execute the workflow.",
      running: 'Running...',
    },

    // ── Execution Order Column ─────────────────────────────────
    order: {
      title: 'Execution Order',
      empty: 'No execution order data.',
      loading: 'Loading...',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      bypassed: 'Bypassed',
    },

    // ── Log Column ─────────────────────────────────────────────
    logViewer: {
      search: 'Search logs',
      noMatch: 'No matching logs',
      autoScroll: 'Auto scroll',
      showDebug: 'Show Debug',
      showTools: 'Show Tools',
      filterAriaLabel: 'Log filter (Show Debug / Show Tools)',
      noLogs: 'No logs.',
      toolCall: 'Tool Call',
      toolResult: 'Tool Result',
      toolError: 'Tool Error',
      inputLabel: 'Input',
      resultLabel: 'Result',
      resultLengthChars: '{{count}} characters',
      citationsLabel: 'Citations',
      errorLabel: 'Error',
      unknownError: 'Unknown error',
    },
  },

  // ── Legacy keys (backward compat — will be removed) ──────────
  executionPanel: {
    title: 'Execution',
    placeholder: "Click 'Run' to execute the workflow.",
    chatPlaceholder: 'Enter a message to run the workflow.',
    chatInputPlaceholder: 'Type a message...',
    send: 'Send',
    tabChat: 'Chat',
    tabExecutor: 'Executor',
    executionFailed: 'Execution Failed',
    unexpectedFormat: 'Unexpected output format.',
    clearOutput: 'Clear Output',
    copyOutput: 'Copy Output',
    copied: 'Copied!',
    runAgentflow: 'Run Agentflow',
    saveAndRun: 'Save & Run',
  },
  detailPanel: {
    log: 'Log',
    noExecutionOrderData: 'No execution order data.',
    applyLayout: 'Apply Layout',
    applyLayoutTooltip: 'Arrange nodes according to sorted execution order',
    graph: 'Graph',
    detail: 'Detail',
  },
  bottom: {
    execution: 'Execution',
    log: 'Log',
    clear: 'Clear',
    fullscreen: 'Full screen',
    expand: 'Expand',
    collapse: 'Collapse',
  },
  logViewer: {
    showDebug: 'Show Debug',
    showTools: 'Show Tools',
    filterAriaLabel: 'Log filter (Show Debug / Show Tools)',
    noLogs: 'No logs.',
    toolCall: 'Tool Call',
    toolResult: 'Tool Result',
    toolError: 'Tool Error',
    inputLabel: 'Input',
    resultLabel: 'Result',
    resultLengthChars: '{{count}} characters',
    citationsLabel: 'Citations',
    errorLabel: 'Error',
    unknownError: 'Unknown error',
  },
};
