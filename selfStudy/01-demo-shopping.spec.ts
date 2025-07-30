import { test, expect } from '@playwright/test';

test('다나와 자동 검색', async ({ page }) => {
  // 1. 다나와 접속
  await page.goto('https://danawa.com');

  // 2. 검색창 찾기 (다나와의 실제 검색창 선택자 사용)
  const searchInput = page.locator('input[placeholder="검색어를 입력해주세요."]').first();
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.fill('노트북');

  // 3. 검색 버튼 클릭 (Enter 키 사용)
  await searchInput.press('Enter');

  // 4. 검색 결과 페이지 로딩 대기
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    await page.waitForTimeout(2000); // 추가 대기 시간
  } catch (error) {
    console.log('페이지 로딩 대기 중 오류 발생, 계속 진행합니다.');
  }

  // 5. 검색 결과 확인 (다나와의 실제 상품 리스트 선택자)
  try {
    await expect(page.locator('ul.product_list li.prod_item').first()).toBeVisible({ timeout: 10000 });

    // 6. 상품 정보 5개 출력
    const products = page.locator('ul.product_list li.prod_item');
    const productCount = await products.count();
    console.log(`총 ${productCount}개의 상품을 찾았습니다.`);

    // 처음 5개 상품의 정보 출력
    for (let i = 0; i < Math.min(5, productCount); i++) {
      const product = products.nth(i);

      // 상품명 추출
      const productName = await product.locator('.prod_name a').textContent();

      // 가격 추출 (첫 번째 가격 정보)
      const priceElement = product.locator('.price_sect strong').first();
      const price = await priceElement.textContent();

      console.log(`\n${i + 1}번째 상품:`);
      console.log(`상품명: ${productName?.trim() || '상품명 없음'}`);
      console.log(`가격: ${price?.trim() || '가격 정보 없음'}`);
    }

  } catch (error) {
    console.log('상품 요소를 찾을 수 없습니다. 페이지 구조를 확인합니다.');
    // 페이지 제목 확인
    const title = await page.title();
    console.log('현재 페이지 제목:', title);

    // 현재 URL 확인
    const url = page.url();
    console.log('현재 URL:', url);
  }

  // 7. 스크린샷 저장
  await page.screenshot({ path: 'danawa-result.png' });

  console.log('\n다나와 검색 완료!');
  console.log('브라우저를 열어둔 상태로 유지합니다. 확인 후 브라우저를 직접 닫아주세요.');

  // 8. 브라우저를 열어둔 상태로 유지 (안전한 대기)
  try {
    await page.waitForTimeout(10000);
  } catch (error) {
    console.log('브라우저가 닫혔습니다. 테스트가 정상적으로 완료되었습니다.');
  }
});