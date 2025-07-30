import { test, expect } from '@playwright/test';

test('회사 웹사이트 상태 확인', async ({ page }) => {
    // 1. 회사 웹사이트 접속
    await page.goto('https://company-website.com');

    // 2. 주요 기능들이 정상 작동하는지 확인
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('link', { name: '고객센터' })).toBeVisible();
    await expect(page.getByRole('link', { name: '제품소개' })).toBeVisible();

    // 3. 페이지 로딩 시간 측정
    const loadTime = await page.evaluate(() =>
        performance.timing.loadEventEnd - performance.timing.navigationStart
    );
    console.log(`페이지 로딩 시간: ${loadTime}ms`);

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'website-status.png' });

    // 5. 로딩 시간이 3초 이내인지 확인
    expect(loadTime).toBeLessThan(3000);
}); 