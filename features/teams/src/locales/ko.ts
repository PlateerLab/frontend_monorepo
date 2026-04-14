export const ko = {
  title: 'Teams',
  description: 'AI 에이전트 협업 채팅',

  // Sidebar
  sidebar: {
    rooms: '채팅방',
    workflows: '워크플로우',
    search: '채팅방 검색...',
    createRoom: '새 채팅방',
    noRooms: '채팅방이 없습니다',
    noRoomsDesc: '새 채팅방을 만들어 AI 에이전트와 대화를 시작하세요.',
    noWorkflows: '등록된 워크플로우가 없습니다',
    filter: {
      all: '전체',
      active: '활성',
      archived: '보관',
    },
  },

  // Room Card
  room: {
    agents: '에이전트',
    unread: '읽지 않음',
    delete: '삭제',
    deleteConfirm: '이 채팅방을 삭제하시겠습니까?',
  },

  // Create Room Modal
  createRoomModal: {
    title: '새 채팅방 만들기',
    name: '채팅방 이름',
    namePlaceholder: '채팅방 이름을 입력하세요',
    description: '설명 (선택)',
    descriptionPlaceholder: '채팅방 설명을 입력하세요',
    cancel: '취소',
    create: '만들기',
  },

  // Chat Room
  chat: {
    tabs: {
      chat: '채팅',
      share: '공유',
    },
    emptyTitle: '채팅을 시작하세요',
    emptyDesc: '에이전트를 추가하고 메시지를 보내보세요.',
    inputPlaceholder: '메시지를 입력하세요... @로 에이전트를 멘션할 수 있습니다',
    send: '보내기',
    stop: '중지',
    retry: '재시도',
    viewLog: '실행 로그',
    routing: '라우팅 중...',
    executing: '실행 중...',
    streaming: '응답 생성 중...',
    error: {
      sendFailed: '메시지 전송에 실패했습니다',
      executionFailed: '에이전트 실행에 실패했습니다',
    },
  },

  // Top Bar
  topBar: {
    search: '사용자 검색...',
    members: '멤버',
  },

  // User Search Dropdown
  userSearch: {
    loading: '사용자 목록 불러오는 중...',
    noResults: '검색 결과가 없습니다',
    invite: '초대',
    alreadyMember: '초대됨',
    selectRoomFirst: '먼저 채팅방을 선택하세요',
  },

  // Member Panel
  memberPanel: {
    title: '멤버',
    agents: 'AI 에이전트',
    members: '멤버',
    online: '온라인',
    offline: '오프라인',
    addAgent: '에이전트 추가',
    removeAgent: '에이전트 제거',
    search: '멤버 검색...',
  },

  // Log Viewer
  logViewer: {
    title: '실행 로그',
    agent: '에이전트',
    duration: '소요 시간',
    tokens: '토큰 사용량',
    status: '상태',
    timeline: '타임라인',
    rawLogs: '원시 로그',
    running: '실행 중',
    completed: '완료',
    error: '오류',
    close: '닫기',
  },

  // Workflow List
  workflow: {
    online: '온라인',
    offline: '오프라인',
    addToRoom: '방에 추가',
  },

  // Common
  loading: '로딩 중...',
  error: '오류가 발생했습니다',
  noPermission: '접근 권한이 없습니다',
};
