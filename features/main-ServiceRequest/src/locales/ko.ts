import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  serviceRequest: {
    title: '서비스 요청',
    description: '서비스 요청을 생성하고 관리하세요',
    searchPlaceholder: '요청 검색...',
    newRequest: '새 요청',
    tabs: { all: '전체', open: '열림', inProgress: '진행중', resolved: '해결됨' },
    summary: { open: '열림', inProgress: '진행중', resolved: '해결됨', urgent: '긴급' },
    by: '요청자',
    view: '보기',
    time: {
      justNow: '방금',
      hoursAgo: '시간 전',
      daysAgo: '일 전'
    },
    empty: { title: '요청이 없습니다', description: '새 요청을 생성하세요' }
  }
};
