import type { VirtualTutorialScenario } from '../../virtual-cursor-types';
import { tutorialDataToVirtualScenario } from '../../tutorialDataToVirtualScenario';
import { TUTORIALS } from '../index';

/**
 * 기존 기본 튜토리얼(JSON)에서 가상 커서 시나리오를 자동 생성.
 * 별도의 시나리오 파일을 수동으로 관리할 필요 없이,
 * 기본 튜토리얼 내용 그대로 커서가 자동 시연합니다.
 */
export const VIRTUAL_TUTORIALS: VirtualTutorialScenario[] =
    TUTORIALS.map(tutorialDataToVirtualScenario);
