export const en = {
  title: 'Teams',
  description: 'AI Agent Collaborative Chat',

  sidebar: {
    rooms: 'Rooms',
    workflows: 'Workflows',
    search: 'Search rooms...',
    createRoom: 'New Room',
    noRooms: 'No rooms yet',
    noRoomsDesc: 'Create a new room to start chatting with AI agents.',
    noWorkflows: 'No workflows available',
    filter: {
      all: 'All',
      active: 'Active',
      archived: 'Archived',
    },
  },

  room: {
    agents: 'agents',
    unread: 'unread',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this room?',
  },

  createRoomModal: {
    title: 'Create New Room',
    name: 'Room Name',
    namePlaceholder: 'Enter room name',
    description: 'Description (optional)',
    descriptionPlaceholder: 'Enter room description',
    cancel: 'Cancel',
    create: 'Create',
  },

  chat: {
    tabs: {
      chat: 'Chat',
      share: 'Share',
    },
    emptyTitle: 'Start a Conversation',
    emptyDesc: 'Add agents and send a message to get started.',
    inputPlaceholder: 'Type a message... Use @ to mention an agent',
    send: 'Send',
    stop: 'Stop',
    retry: 'Retry',
    viewLog: 'View Log',
    routing: 'Routing...',
    executing: 'Executing...',
    streaming: 'Generating response...',
    error: {
      sendFailed: 'Failed to send message',
      executionFailed: 'Agent execution failed',
    },
  },

  topBar: {
    search: 'Search users...',
    members: 'Members',
  },

  userSearch: {
    loading: 'Loading users...',
    noResults: 'No users found',
    invite: 'Invite',
    alreadyMember: 'Joined',
    selectRoomFirst: 'Please select a room first',
  },

  memberPanel: {
    title: 'Members',
    agents: 'AI Agents',
    members: 'Members',
    online: 'Online',
    offline: 'Offline',
    addAgent: 'Add Agent',
    removeAgent: 'Remove Agent',
    search: 'Search members...',
  },

  logViewer: {
    title: 'Execution Log',
    agent: 'Agent',
    duration: 'Duration',
    tokens: 'Token Usage',
    status: 'Status',
    timeline: 'Timeline',
    rawLogs: 'Raw Logs',
    running: 'Running',
    completed: 'Completed',
    error: 'Error',
    close: 'Close',
  },

  workflow: {
    online: 'Online',
    offline: 'Offline',
    addToRoom: 'Add to Room',
  },

  loading: 'Loading...',
  error: 'An error occurred',
  noPermission: 'Access denied',
};
