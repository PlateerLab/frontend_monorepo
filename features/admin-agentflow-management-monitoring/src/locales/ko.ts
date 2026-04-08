const ko = {
  agentflowMgmtMonitoring: {
    tabLabel: '모니터링',
    tabIOLogs: 'IO 로그',
    tabPerformance: '성능',
    loadLogsError: 'IO 로그를 불러오는데 실패했습니다.',
    noLogs: '기록된 IO 로그가 없습니다.',
    loading: '데이터를 불러오는 중...',
    noPerformanceData: '성능 데이터가 없습니다.',
    deletePerformance: '성능 데이터 삭제',
    deletePerformanceTitle: '성능 데이터 삭제',
    deletePerformanceMessage: '이 에이전트플로우의 성능 데이터를 모두 삭제하시겠습니까?',
    deletePerformanceSuccess: '성능 데이터가 삭제되었습니다.',
    deletePerformanceError: '성능 데이터 삭제에 실패했습니다.',
    columns: {
      timestamp: '시간',
      mode: '모드',
      input: '입력',
      output: '출력',
      interactionId: '인터렉션 ID',
    },
    perf: {
      totalExecutions: '총 실행 횟수',
      avgTime: '평균 처리 시간',
      avgCpu: '평균 CPU',
      avgRam: '평균 RAM',
      avgGpu: '평균 GPU',
      nodeName: '노드명',
      execCount: '실행 횟수',
    },
  },
};

export default ko;
