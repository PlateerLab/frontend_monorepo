import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  chatNew: {
    title: '새 채팅',
    description: '워크플로우를 선택하여 새 채팅을 시작하세요',
    searchPlaceholder: '워크플로우 검색...',
    sections: { favorites: '즐겨찾기', all: '전체 워크플로우' },
    owner: { all: '전체', personal: '개인', shared: '공유' },
    addFavorite: '즐겨찾기 추가',
    removeFavorite: '즐겨찾기 제거',
    startChat: '채팅 시작',
    personal: '개인',
    shared: '공유',
    usageCount: '사용 횟수',
    today: '오늘',
    yesterday: '어제',
    daysAgo: '일 전',
    empty: { title: '워크플로우가 없습니다', description: '먼저 워크플로우를 생성하세요' },
    error: {
      loadFailed: '워크플로우를 불러오지 못했습니다',
      saveFailed: '저장에 실패했습니다'
    }
  }
};
