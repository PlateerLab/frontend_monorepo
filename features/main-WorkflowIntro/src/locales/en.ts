import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  workflowIntro: {
    title: 'Workflow',
    hero: {
      title: 'AI Workflow Builder',
      description: 'Build powerful AI pipelines with drag and drop',
      primaryAction: 'Go to Canvas',
      secondaryAction: 'Explore Workflows'
    },
    features: {
      title: 'Key Features',
      canvas: { title: 'Visual Canvas', description: 'Intuitive drag and drop interface' },
      nodes: { title: 'Various Nodes', description: 'AI, data, and logic nodes available' },
      ai: { title: 'AI Integration', description: 'Easy integration with various AI models' },
      deploy: { title: 'One-click Deploy', description: 'Instant API deployment' }
    },
    quickActions: { title: 'Quick Actions' },
    actions: {
      createCanvas: 'Create Canvas',
      viewTools: 'View Tools',
      manageDocuments: 'Manage Documents',
      editPrompts: 'Edit Prompts'
    },
    stats: {
      workflows: 'Workflows',
      nodeTypes: 'Node Types',
      executions: 'Executions',
      uptime: 'Uptime'
    }
  }
};
