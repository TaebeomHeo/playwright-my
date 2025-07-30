import { test, expect } from '@playwright/test';

test('Google 검색 자동화', async ({ page }) => {
    // 1. 구글 홈페이지 접속
    await page.goto('https://www.google.com/');

    // 2. 검색창 찾기 (실제 구글의 선택자에 맞게 수정)
    const searchInput = page.locator('input[name="q"]').first();
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.fill('Playwright 자습서');
    await searchInput.press('Enter');

    // 3. 검색 결과 로딩 대기
    await page.waitForLoadState('networkidle');

    // 4. 첫 번째 검색 결과 클릭
    const firstResult = page.locator('a[href*="playwright"]').first();
    await firstResult.waitFor({ state: 'visible' });
    await firstResult.click();

    // 5. 페이지 로딩 대기
    await page.waitForLoadState('networkidle');

    // 6. 페이지 제목 확인
    await expect(page).toHaveTitle(/Playwright/);

    // 7. 스크린샷 저장
    await page.screenshot({ path: 'google-search-result.png' });

    console.log('구글 검색 완료!');
}); 