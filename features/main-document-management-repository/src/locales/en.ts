import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  repository: {
    searchPlaceholder: 'Search repositories...',
    buttons: {
      newRepository: 'New Repository',
    },
    createModal: {
      title: 'Connect New Repository',
      collectionName: 'Collection Name',
      collectionNamePlaceholder: 'Enter collection name for sync',
      repoName: 'Repository Name',
      repoNamePlaceholder: 'Enter repository name',
      gitlabUrl: 'GitLab URL',
      gitlabUrlPlaceholder: 'https://gitlab.example.com/group/project',
      accessToken: 'Access Token',
      accessTokenPlaceholder: 'Enter GitLab access token',
      branch: 'Branch',
      cronSchedule: 'Sync Schedule (Cron)',
      cronPlaceholder: '0 6 * * *',
      cronHint: 'e.g. 0 6 * * * (daily at 6 AM)',
      annotation: 'Enable Annotation',
      annotationDesc: 'Automatically add annotations to documents',
      apiExtract: 'Enable API Extraction',
      apiExtractDesc: 'Automatically extract API info from code',
      create: 'Connect',
      creating: 'Connecting...',
      cancel: 'Cancel',
    },
    empty: {
      title: 'No repositories',
      description: 'Add a new repository',
    },
    syncNow: 'Sync',
    lastSync: 'Last sync',
    active: 'Active',
    inactive: 'Inactive',
  },
};
