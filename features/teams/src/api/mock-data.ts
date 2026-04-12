/**
 * XGEN Teams – Mock Data
 * 백엔드 없이 UI를 확인하기 위한 더미 데이터
 */

import type {
  TeamsRoom,
  TeamsAgent,
  TeamsMember,
  TeamsMessage,
  ExecutionLog,
  RoutingResult,
} from '../types';

// ─────────────────────────────────────────────────────────────
// Agents (Available Workflows)
// ─────────────────────────────────────────────────────────────

export const MOCK_AGENTS: TeamsAgent[] = [
  {
    id: 'agent_001',
    name: 'RAG Assistant',
    description: '문서 검색 및 질의응답 에이전트',
    status: 'online',
    color: '#6264A7',
    stats: { totalExecutions: 142, avgResponseTime: 2300 },
  },
  {
    id: 'agent_002',
    name: 'Code Reviewer',
    description: '코드 리뷰 및 품질 분석 에이전트',
    status: 'online',
    color: '#E74856',
    stats: { totalExecutions: 87, avgResponseTime: 3100 },
  },
  {
    id: 'agent_003',
    name: 'Data Analyst',
    description: '데이터 분석 및 시각화 에이전트',
    status: 'online',
    color: '#0078D4',
    stats: { totalExecutions: 56, avgResponseTime: 4200 },
  },
  {
    id: 'agent_004',
    name: 'Translator',
    description: '다국어 번역 에이전트 (한/영/일/중)',
    status: 'offline',
    color: '#00B294',
    stats: { totalExecutions: 203, avgResponseTime: 1500 },
  },
  {
    id: 'agent_005',
    name: 'Report Generator',
    description: '보고서 자동 생성 에이전트',
    status: 'online',
    color: '#FF8C00',
    stats: { totalExecutions: 34, avgResponseTime: 5600 },
  },
];

// ─────────────────────────────────────────────────────────────
// Members
// ─────────────────────────────────────────────────────────────

export const MOCK_MEMBERS: TeamsMember[] = [
  { userId: 1, username: 'admin', role: 'owner', isOnline: true, joinedAt: '2026-04-01T09:00:00Z' },
  { userId: 2, username: '김개발', role: 'admin', isOnline: true, joinedAt: '2026-04-02T10:00:00Z' },
  { userId: 3, username: '이디자인', role: 'member', isOnline: false, joinedAt: '2026-04-03T11:00:00Z' },
  { userId: 4, username: '박기획', role: 'member', isOnline: true, joinedAt: '2026-04-05T14:00:00Z' },
];

// ─────────────────────────────────────────────────────────────
// Rooms
// ─────────────────────────────────────────────────────────────

export const MOCK_ROOMS: TeamsRoom[] = [
  {
    id: 'room_001',
    name: '프로젝트 Alpha',
    description: 'Alpha 프로젝트 팀 채팅방',
    agents: [MOCK_AGENTS[0], MOCK_AGENTS[1]],
    members: [MOCK_MEMBERS[0], MOCK_MEMBERS[1], MOCK_MEMBERS[3]],
    routerConfig: {
      mode: 'hybrid',
      llmModel: 'claude-haiku-4-5-20251001',
      confidenceThreshold: 0.7,
      fallbackAction: 'ask_user',
    },
    createdAt: '2026-04-01T09:00:00Z',
    createdBy: 'admin',
    lastMessageAt: '2026-04-11T05:30:00Z',
    unreadCount: 3,
  },
  {
    id: 'room_002',
    name: '문서 분석팀',
    description: 'RAG 기반 문서 분석 작업방',
    agents: [MOCK_AGENTS[0], MOCK_AGENTS[2]],
    members: [MOCK_MEMBERS[0], MOCK_MEMBERS[2]],
    routerConfig: {
      mode: 'auto',
      llmModel: 'claude-haiku-4-5-20251001',
      confidenceThreshold: 0.8,
      fallbackAction: 'broadcast',
    },
    createdAt: '2026-04-05T14:00:00Z',
    createdBy: 'admin',
    lastMessageAt: '2026-04-10T18:00:00Z',
    unreadCount: 0,
  },
  {
    id: 'room_003',
    name: '번역 작업방',
    description: '다국어 번역 및 검수',
    agents: [MOCK_AGENTS[3]],
    members: [MOCK_MEMBERS[1], MOCK_MEMBERS[2], MOCK_MEMBERS[3]],
    routerConfig: {
      mode: 'manual',
      llmModel: 'claude-haiku-4-5-20251001',
      confidenceThreshold: 0.7,
      fallbackAction: 'ask_user',
    },
    createdAt: '2026-04-08T10:00:00Z',
    createdBy: '김개발',
    lastMessageAt: '2026-04-11T02:15:00Z',
    unreadCount: 1,
  },
];

// ─────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────

export const MOCK_MESSAGES: Record<string, TeamsMessage[]> = {
  room_001: [
    {
      id: 'msg_001',
      roomId: 'room_001',
      sender: { type: 'system', id: 'system', name: 'System' },
      content: '프로젝트 Alpha 채팅방이 생성되었습니다.',
      type: 'system',
      createdAt: '2026-04-01T09:00:00Z',
      status: 'sent',
    },
    {
      id: 'msg_002',
      roomId: 'room_001',
      sender: { type: 'user', id: '1', name: 'admin' },
      content: '@RAG Assistant 최근 업로드된 설계 문서에서 API 스펙 요약해줘',
      type: 'user',
      createdAt: '2026-04-11T05:00:00Z',
      status: 'sent',
    },
    {
      id: 'msg_003',
      roomId: 'room_001',
      sender: { type: 'agent', id: 'agent_001', name: 'RAG Assistant', color: '#6264A7' },
      content: '설계 문서에서 API 스펙을 확인했습니다.\n\n## 주요 엔드포인트\n\n1. **POST /api/teams/rooms/create** - 채팅방 생성\n2. **GET /api/teams/rooms/list** - 방 목록 조회\n3. **POST /api/teams/rooms/:id/messages** - 메시지 전송\n4. **POST /api/teams/execute/:agentId/stream** - 에이전트 실행 (SSE)\n\n각 엔드포인트의 상세 요청/응답 스펙은 별도로 정리해드릴까요?',
      type: 'agent',
      metadata: { executionId: 'exec_001' },
      createdAt: '2026-04-11T05:00:15Z',
      status: 'sent',
    },
    {
      id: 'msg_004',
      roomId: 'room_001',
      sender: { type: 'user', id: '2', name: '김개발' },
      content: '@Code Reviewer 이번 PR #42 코드 좀 봐줘. 특히 에러 핸들링 부분.',
      type: 'user',
      createdAt: '2026-04-11T05:15:00Z',
      status: 'sent',
    },
    {
      id: 'msg_005',
      roomId: 'room_001',
      sender: { type: 'agent', id: 'agent_002', name: 'Code Reviewer', color: '#E74856' },
      content: 'PR #42 코드 리뷰 결과입니다.\n\n**발견된 이슈 (2건)**\n\n1. `useTeamsChat.ts:155` - catch 블록에서 에러 타입 체크 없이 `err.message` 접근\n2. `teams-api.ts:225` - SSE 스트림 파싱 시 malformed JSON에 대한 처리 부족\n\n**권장 사항**\n- `instanceof Error` 체크 추가\n- JSON.parse를 try-catch로 감싸고 로깅 추가\n\n전반적으로 구조는 깔끔합니다. 위 2건만 수정하면 머지 가능합니다.',
      type: 'agent',
      metadata: { executionId: 'exec_002' },
      createdAt: '2026-04-11T05:15:30Z',
      status: 'sent',
    },
    {
      id: 'msg_006',
      roomId: 'room_001',
      sender: { type: 'user', id: '1', name: 'admin' },
      content: '고마워 둘 다. 바로 반영할게.',
      type: 'user',
      createdAt: '2026-04-11T05:30:00Z',
      status: 'sent',
    },
  ],
  room_002: [
    {
      id: 'msg_010',
      roomId: 'room_002',
      sender: { type: 'system', id: 'system', name: 'System' },
      content: '문서 분석팀 채팅방이 생성되었습니다.',
      type: 'system',
      createdAt: '2026-04-05T14:00:00Z',
      status: 'sent',
    },
    {
      id: 'msg_011',
      roomId: 'room_002',
      sender: { type: 'user', id: '1', name: 'admin' },
      content: '이번 분기 매출 보고서 분석해줘',
      type: 'user',
      createdAt: '2026-04-10T17:50:00Z',
      status: 'sent',
    },
    {
      id: 'msg_012',
      roomId: 'room_002',
      sender: { type: 'agent', id: 'agent_003', name: 'Data Analyst', color: '#0078D4' },
      content: '2026년 1분기 매출 보고서를 분석했습니다.\n\n- 총 매출: ₩1,250,000,000 (전분기 대비 +12.3%)\n- 주요 성장 부문: SaaS 구독 (+23%), 컨설팅 (+8%)\n- 주의 필요: 하드웨어 매출 감소 (-5.2%)\n\n상세 차트와 데이터를 첨부할까요?',
      type: 'agent',
      metadata: { executionId: 'exec_003' },
      createdAt: '2026-04-10T18:00:00Z',
      status: 'sent',
    },
  ],
  room_003: [],
};

// ─────────────────────────────────────────────────────────────
// Execution Log
// ─────────────────────────────────────────────────────────────

export const MOCK_EXECUTION_LOGS: Record<string, ExecutionLog> = {
  exec_001: {
    id: 'exec_001',
    roomId: 'room_001',
    messageId: 'msg_003',
    agentId: 'agent_001',
    agentName: 'RAG Assistant',
    startedAt: '2026-04-11T05:00:01Z',
    completedAt: '2026-04-11T05:00:14Z',
    duration: 13000,
    status: 'completed',
    tokenUsage: { input: 1250, output: 380, total: 1630 },
    nodeExecutions: [
      { nodeId: 'node_1', nodeName: 'Query Parser', status: 'completed', startedAt: '2026-04-11T05:00:01Z', completedAt: '2026-04-11T05:00:03Z' },
      { nodeId: 'node_2', nodeName: 'Document Retriever', status: 'completed', startedAt: '2026-04-11T05:00:03Z', completedAt: '2026-04-11T05:00:08Z' },
      { nodeId: 'node_3', nodeName: 'LLM Summarizer', status: 'completed', startedAt: '2026-04-11T05:00:08Z', completedAt: '2026-04-11T05:00:14Z' },
    ],
    rawLogs: [
      { timestamp: '2026-04-11T05:00:01Z', level: 'info', message: 'Parsing user query...' },
      { timestamp: '2026-04-11T05:00:03Z', level: 'info', message: 'Found 3 relevant documents' },
      { timestamp: '2026-04-11T05:00:08Z', level: 'info', message: 'Generating summary with LLM...' },
      { timestamp: '2026-04-11T05:00:14Z', level: 'info', message: 'Execution completed successfully' },
    ],
  },
  exec_002: {
    id: 'exec_002',
    roomId: 'room_001',
    messageId: 'msg_005',
    agentId: 'agent_002',
    agentName: 'Code Reviewer',
    startedAt: '2026-04-11T05:15:02Z',
    completedAt: '2026-04-11T05:15:28Z',
    duration: 26000,
    status: 'completed',
    tokenUsage: { input: 3200, output: 520, total: 3720 },
    nodeExecutions: [
      { nodeId: 'node_1', nodeName: 'PR Fetcher', status: 'completed', startedAt: '2026-04-11T05:15:02Z', completedAt: '2026-04-11T05:15:05Z' },
      { nodeId: 'node_2', nodeName: 'Code Analyzer', status: 'completed', startedAt: '2026-04-11T05:15:05Z', completedAt: '2026-04-11T05:15:20Z' },
      { nodeId: 'node_3', nodeName: 'Review Writer', status: 'completed', startedAt: '2026-04-11T05:15:20Z', completedAt: '2026-04-11T05:15:28Z' },
    ],
    rawLogs: [
      { timestamp: '2026-04-11T05:15:02Z', level: 'info', message: 'Fetching PR #42 diff...' },
      { timestamp: '2026-04-11T05:15:05Z', level: 'info', message: 'Analyzing 8 changed files...' },
      { timestamp: '2026-04-11T05:15:20Z', level: 'warn', message: 'Found 2 potential issues' },
      { timestamp: '2026-04-11T05:15:28Z', level: 'info', message: 'Review completed' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// Mock Routing
// ─────────────────────────────────────────────────────────────

export function mockRouteMessage(
  content: string,
  roomAgents: TeamsAgent[]
): RoutingResult {
  // @mention 감지
  const mentionRegex = /@(\S+)/g;
  let match;
  const mentionedAgents: TeamsAgent[] = [];

  while ((match = mentionRegex.exec(content)) !== null) {
    const name = match[1];
    const agent = roomAgents.find(
      (a) => a.name.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, '')
    );
    if (agent) mentionedAgents.push(agent);
  }

  if (mentionedAgents.length > 0) {
    return {
      method: 'mention',
      targets: mentionedAgents.map((a) => ({
        agentId: a.id,
        agentName: a.name,
        confidence: 1.0,
        reason: '@mention direct routing',
      })),
    };
  }

  // mention 없으면 첫 번째 에이전트로 라우팅 (mock)
  if (roomAgents.length > 0) {
    return {
      method: 'llm',
      targets: [
        {
          agentId: roomAgents[0].id,
          agentName: roomAgents[0].name,
          confidence: 0.85,
          reason: 'LLM routing (mock)',
        },
      ],
    };
  }

  return { method: 'none', targets: [] };
}
