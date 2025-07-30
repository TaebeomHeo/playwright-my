import { test } from '@playwright/test';

test('다나와 노트북 검색 및 상품 상세', async ({ page }) => {
  // 1. 다나와 접속
  await page.goto('https://danawa.com/');

  // 2. 검색창 클릭 및 검색어 입력
  await page.getByRole('textbox', { name: '검색어 입력' }).click();
  await page.getByRole('textbox', { name: '검색어 입력' }).fill('노트북');
  await page.getByRole('textbox', { name: '검색어 입력' }).press('Enter');

  // 3. 검색 결과 로딩 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // 추가 대기 시간

  // 4. 검색 결과가 나타날 때까지 대기
  await page.waitForSelector('ul.product_list li.prod_item', { timeout: 10000 });

  // 5. 검색 버튼 클릭 (필요한 경우)
  await page.getByRole('button', { name: '검색', exact: true }).click();

  // 6. 팝업 대기 및 상품 클릭
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: '삼성전자 갤럭시북4 NT750XGR-A51A WIN11', exact: true }).click();
  const page1 = await page1Promise;

  // 7. 두 번째 팝업 대기 및 상품 상세 클릭
  const page2Promise = page1.waitForEvent('popup');
  await page1.getByRole('listitem').filter({ hasText: '최저가 797,900 원 무료배송' }).getByLabel('상품보기').click();
  const page2 = await page2Promise;

  // 8. 팝업 처리
  await page2.locator('#popupCheck').check();
  await page2.getByRole('link', { name: '[닫기]' }).click();
});