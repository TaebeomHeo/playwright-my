import { test, expect } from '@playwright/test';

test('회원가입 자동화', async ({ page }) => {
    // 1. 회원가입 페이지 접속
    await page.goto('https://signup.example.com');

    // 2. 폼 입력
    await page.getByLabel('이름').fill('테스트 사용자');
    await page.getByLabel('이메일').fill('test@example.com');
    await page.getByLabel('비밀번호').fill('password123');
    await page.getByLabel('비밀번호 확인').fill('password123');

    // 3. 약관 동의
    await page.getByLabel('이용약관 동의').check();
    await page.getByLabel('개인정보처리방침 동의').check();

    // 4. 가입 버튼 클릭
    await page.getByRole('button', { name: '가입하기' }).click();

    // 5. 성공 메시지 확인
    await expect(page.getByText('가입이 완료되었습니다')).toBeVisible();

    // 6. 환영 이메일 확인
    await expect(page.getByText('환영합니다!')).toBeVisible();

    // 7. 스크린샷 저장
    await page.screenshot({ path: 'signup-success.png' });
}); 