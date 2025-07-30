import { test, expect } from '@playwright/test';

// 팀원 A가 만든 시나리오: 로그인 플로우 테스트
test('로그인 플로우 테스트', async ({ page }) => {
    // 1. 로그인 페이지 접속
    await page.goto('https://example.com/login');

    // 2. 로그인 폼 입력
    await page.getByLabel('이메일').fill('user@example.com');
    await page.getByLabel('비밀번호').fill('password123');

    // 3. 로그인 버튼 클릭
    await page.getByRole('button', { name: '로그인' }).click();

    // 4. 로그인 성공 확인
    await expect(page.getByText('환영합니다!')).toBeVisible();

    // 5. 대시보드로 이동 확인
    await expect(page).toHaveURL(/.*dashboard/);

    // 6. 사용자 정보 표시 확인
    await expect(page.getByTestId('user-profile')).toBeVisible();
});

// 팀원 B가 만든 시나리오: 상품 검색 테스트
test('상품 검색 테스트', async ({ page }) => {
    // 1. 쇼핑몰 메인 페이지 접속
    await page.goto('https://shopping.example.com');

    // 2. 검색창에 상품명 입력
    await page.getByPlaceholder('상품을 검색하세요').fill('노트북');
    await page.keyboard.press('Enter');

    // 3. 검색 결과 확인
    await expect(page.getByText('검색 결과')).toBeVisible();

    // 4. 필터 적용 (가격순 정렬)
    await page.getByRole('button', { name: '가격순' }).click();

    // 5. 첫 번째 상품 클릭
    await page.getByTestId('product-item').first().click();

    // 6. 상품 상세 페이지 확인
    await expect(page.getByTestId('product-detail')).toBeVisible();
    await expect(page.getByTestId('product-price')).toBeVisible();
});

// 팀원 C가 만든 시나리오: 장바구니 테스트
test('장바구니 테스트', async ({ page }) => {
    // 1. 상품 페이지 접속
    await page.goto('https://shopping.example.com/product/123');

    // 2. 수량 선택
    await page.getByLabel('수량').selectOption('2');

    // 3. 장바구니에 추가
    await page.getByRole('button', { name: '장바구니 추가' }).click();

    // 4. 장바구니 추가 성공 메시지 확인
    await expect(page.getByText('장바구니에 추가되었습니다')).toBeVisible();

    // 5. 장바구니 페이지로 이동
    await page.getByRole('link', { name: '장바구니' }).click();

    // 6. 장바구니에 상품이 있는지 확인
    await expect(page.getByTestId('cart-item')).toBeVisible();

    // 7. 총 금액 확인
    await expect(page.getByTestId('total-price')).toContainText('원');
});

// 팀원 D가 만든 시나리오: 결제 플로우 테스트
test('결제 플로우 테스트', async ({ page }) => {
    // 1. 장바구니에 상품이 있다고 가정하고 결제 페이지 접속
    await page.goto('https://shopping.example.com/checkout');

    // 2. 배송 정보 입력
    await page.getByLabel('받는 사람').fill('홍길동');
    await page.getByLabel('연락처').fill('010-1234-5678');
    await page.getByLabel('주소').fill('서울시 강남구 테헤란로 123');

    // 3. 결제 방법 선택
    await page.getByLabel('신용카드').check();

    // 4. 카드 정보 입력
    await page.getByLabel('카드번호').fill('1234-5678-9012-3456');
    await page.getByLabel('유효기간').fill('12/25');
    await page.getByLabel('CVC').fill('123');

    // 5. 결제 버튼 클릭
    await page.getByRole('button', { name: '결제하기' }).click();

    // 6. 결제 성공 확인
    await expect(page.getByText('결제가 완료되었습니다')).toBeVisible();

    // 7. 주문 번호 확인
    await expect(page.getByTestId('order-number')).toBeVisible();
});

// 팀원 E가 만든 시나리오: 모바일 반응형 테스트
test('모바일 반응형 테스트', async ({ page }) => {
    // 1. 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });

    // 2. 웹사이트 접속
    await page.goto('https://example.com');

    // 3. 모바일 메뉴 버튼 확인
    await expect(page.getByRole('button', { name: '메뉴' })).toBeVisible();

    // 4. 모바일 메뉴 열기
    await page.getByRole('button', { name: '메뉴' }).click();

    // 5. 모바일 메뉴 항목들 확인
    await expect(page.getByRole('link', { name: '홈' })).toBeVisible();
    await expect(page.getByRole('link', { name: '서비스' })).toBeVisible();
    await expect(page.getByRole('link', { name: '고객센터' })).toBeVisible();

    // 6. 메뉴 닫기
    await page.getByRole('button', { name: '닫기' }).click();

    // 7. 메뉴가 숨겨졌는지 확인
    await expect(page.getByRole('link', { name: '홈' })).not.toBeVisible();
});

// 팀원 F가 만든 시나리오: 접근성 테스트
test('접근성 테스트', async ({ page }) => {
    // 1. 웹사이트 접속
    await page.goto('https://example.com');

    // 2. 모든 이미지에 alt 텍스트가 있는지 확인
    const images = await page.locator('img').all();
    for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
    }

    // 3. 모든 링크에 의미있는 텍스트가 있는지 확인
    const links = await page.locator('a').all();
    for (const link of links) {
        const text = await link.textContent();
        expect(text?.trim()).toBeTruthy();
    }

    // 4. 폼 요소들이 라벨과 연결되어 있는지 확인
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
        const id = await input.getAttribute('id');
        if (id) {
            const label = await page.locator(`label[for="${id}"]`).count();
            expect(label).toBeGreaterThan(0);
        }
    }

    // 5. 키보드 네비게이션 테스트
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
}); 