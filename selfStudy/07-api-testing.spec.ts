import { test, expect } from '@playwright/test';

test('API 응답 확인', async ({ page }) => {
    // 1. API 요청 가로채기
    await page.route('**/api/users', async route => {
        // API 응답 모킹
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                users: [
                    { id: 1, name: '홍길동', email: 'hong@example.com' },
                    { id: 2, name: '김철수', email: 'kim@example.com' }
                ]
            })
        });
    });

    // 2. 웹사이트 접속
    await page.goto('https://example.com/users');

    // 3. 사용자 목록 확인
    await expect(page.getByText('홍길동')).toBeVisible();
    await expect(page.getByText('김철수')).toBeVisible();

    // 4. 사용자 수 확인
    await expect(page.getByTestId('user-item')).toHaveCount(2);

    // 5. 스크린샷 저장
    await page.screenshot({ path: 'api-test-result.png' });
}); 