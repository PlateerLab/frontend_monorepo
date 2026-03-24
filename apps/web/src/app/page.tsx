/**
 * Home Page
 *
 * 설계 원칙:
 * - App은 조립만 한다. 비즈니스 코드 넣지 않는다.
 * - Feature에서 컴포넌트를 import하여 렌더링만 한다.
 */
/**
 * Home Page
 *
 * 설계 원칙:
 * - App은 조립만 한다. 비즈니스 코드 넣지 않는다.
 * - Feature에서 컴포넌트를 import하여 렌더링만 한다.
 */
import IntroductionEntry from '@/components/IntroductionEntry';

export default function HomePage() {
  return <IntroductionEntry />;
}
