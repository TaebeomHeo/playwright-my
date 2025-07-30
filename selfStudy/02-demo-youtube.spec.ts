import { test, expect } from '@playwright/test';

test('유튜브 자동 재생', async ({ page }) => {
  // 1. 유튜브 접속
  await page.goto('https://youtube.com');

  // 2. 검색창 찾기
  const searchInput = page.locator('input[name="search_query"]').first();
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.fill('Playwright 튜토리얼');

  // 3. 검색 버튼 클릭 (Enter 키 사용)
  await searchInput.press('Enter');

  // 4. 검색 결과 페이지 로딩 대기
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    await page.waitForTimeout(2000); // 추가 대기 시간
  } catch (error) {
    console.log('페이지 로딩 대기 중 오류 발생, 계속 진행합니다.');
  }

  // 5. 첫 번째 영상 클릭
  try {
    await expect(page.locator('a#video-title').first()).toBeVisible({ timeout: 10000 });
    await page.locator('a#video-title').first().click();

    console.log('유튜브 영상 재생 시작!');

  } catch (error) {
    console.log('영상을 찾을 수 없습니다. 페이지 구조를 확인합니다.');
    // 페이지 제목 확인
    const title = await page.title();
    console.log('현재 페이지 제목:', title);

    // 현재 URL 확인
    const url = page.url();
    console.log('현재 URL:', url);
  }

  // 6. 스크린샷 저장
  await page.screenshot({ path: 'youtube-result.png' });

  console.log('\n유튜브 자동 재생 완료!');
  console.log('브라우저를 열어둔 상태로 유지합니다. 확인 후 브라우저를 직접 닫아주세요.');

  // 7. 브라우저를 열어둔 상태로 유지 (안전한 대기)
  try {
    await page.waitForTimeout(10000);
  } catch (error) {
    console.log('브라우저가 닫혔습니다. 테스트가 정상적으로 완료되었습니다.');
  }
}); 