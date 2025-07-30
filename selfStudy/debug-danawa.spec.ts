const { test, expect } = require('@playwright/test');

test('다나와 TV 필터 상세 분석 테스트 (사용자 직접 확인)', async ({ page }) => {
  console.log('=== 다나와 TV 필터 상세 분석 시작 (사용자 직접 확인) ===');

  // 1. TV 페이지로 직접 이동
  console.log('1. TV 페이지로 직접 이동...');
  await page.goto('https://prod.danawa.com/list/?cate=10248425');
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  const title = await page.title();
  console.log(`현재 URL: ${currentUrl}`);
  console.log(`페이지 제목: ${title}`);

  // 2. 페이지 스크린샷 저장
  await page.screenshot({ path: 'debug-danawa-tv-detailed.png' });
  console.log('TV 페이지 스크린샷 저장됨');

  // 3. 체크박스 전체 개수 확인
  console.log('3. 체크박스 전체 개수 확인...');
  const checkboxes = page.getByRole('checkbox');
  const checkboxCount = await checkboxes.count();
  console.log(`총 체크박스 개수: ${checkboxCount}개`);

  // 4. 사용자가 직접 찾을 수 있도록 안내
  console.log('4. 사용자 직접 확인 안내...');
  console.log('=== 사용자 확인 가이드 ===');
  console.log('1. 브라우저에서 체크박스들을 직접 확인해보세요');
  console.log('2. 브랜드 필터, 화면크기 필터, 해상도 필터를 찾아보세요');
  console.log('3. 각 필터의 체크박스 개수와 라벨을 확인해보세요');
  console.log('4. 상품 목록도 확인해보세요');
  console.log('========================');

  // 5. 주요 필터 섹션 하이라이트 (사용자 확인용)
  console.log('5. 주요 필터 섹션 하이라이트...');

  // 브랜드 관련 요소 찾기
  const brandElements = page.getByText('브랜드');
  if (await brandElements.count() > 0) {
    console.log('브랜드 섹션 발견! 하이라이트 중...');
    const brandSection = brandElements.first();
    await brandSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await page.evaluate((element) => {
      element.style.border = '5px solid red';
      element.style.backgroundColor = 'yellow';
      element.style.fontSize = '20px';
      element.style.fontWeight = 'bold';
    }, await brandSection.elementHandle());

    console.log('브랜드 섹션 하이라이트 완료 (빨간색 테두리)');
    await page.waitForTimeout(3000);
  }

  // 화면크기 관련 요소 찾기
  const sizeElements = page.getByText('화면크기');
  if (await sizeElements.count() > 0) {
    console.log('화면크기 섹션 발견! 하이라이트 중...');
    const sizeSection = sizeElements.first();
    await sizeSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await page.evaluate((element) => {
      element.style.border = '5px solid blue';
      element.style.backgroundColor = 'lightblue';
      element.style.fontSize = '20px';
      element.style.fontWeight = 'bold';
    }, await sizeSection.elementHandle());

    console.log('화면크기 섹션 하이라이트 완료 (파란색 테두리)');
    await page.waitForTimeout(3000);
  }

  // 해상도 관련 요소 찾기
  const resolutionElements = page.getByText('해상도');
  if (await resolutionElements.count() > 0) {
    console.log('해상도 섹션 발견! 하이라이트 중...');
    const resolutionSection = resolutionElements.first();
    await resolutionSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await page.evaluate((element) => {
      element.style.border = '5px solid green';
      element.style.backgroundColor = 'lightgreen';
      element.style.fontSize = '20px';
      element.style.fontWeight = 'bold';
    }, await resolutionSection.elementHandle());

    console.log('해상도 섹션 하이라이트 완료 (초록색 테두리)');
    await page.waitForTimeout(3000);
  }

  // 6. 상품 목록 하이라이트
  console.log('6. 상품 목록 하이라이트...');
  const productList = page.locator('ul.product_list');
  if (await productList.count() > 0) {
    console.log('상품 목록 발견! 하이라이트 중...');
    await productList.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await page.evaluate((element) => {
      element.style.border = '5px solid orange';
      element.style.backgroundColor = 'lightyellow';
    }, await productList.elementHandle());

    console.log('상품 목록 하이라이트 완료 (주황색 테두리)');
    await page.waitForTimeout(3000);
  }

  // 7. 사용자 확인을 위한 대기
  console.log('7. 사용자 확인을 위한 대기...');
  console.log('=== 확인 사항 ===');
  console.log('- 빨간색 테두리: 브랜드 필터 섹션');
  console.log('- 파란색 테두리: 화면크기 필터 섹션');
  console.log('- 초록색 테두리: 해상도 필터 섹션');
  console.log('- 주황색 테두리: 상품 목록');
  console.log('- 각 섹션에서 체크박스 개수와 라벨을 확인해보세요');
  console.log('================');

  console.log('브라우저를 60초간 열어둡니다... (충분한 확인 시간)');
  await page.waitForTimeout(60000);

  console.log('=== 분석 완료 ===');
}); 