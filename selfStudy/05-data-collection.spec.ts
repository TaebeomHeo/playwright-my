import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('상품 가격 모니터링', async ({ page }) => {
    // 1. 쇼핑 사이트 접속
    await page.goto('https://shopping-site.com/product/123');

    // 2. 상품 정보 수집
    const price = await page.getByTestId('product-price').textContent();
    const stock = await page.getByTestId('stock-status').textContent();
    const rating = await page.getByTestId('product-rating').textContent();

    // 3. 콘솔에 정보 출력
    console.log(`상품 정보:`);
    console.log(`- 가격: ${price}`);
    console.log(`- 재고: ${stock}`);
    console.log(`- 평점: ${rating}`);

    // 4. 특정 조건일 때 알림
    if (price && price.includes('할인')) {
        console.log('🎉 할인 상품 발견!');
    }

    // 5. 데이터를 파일로 저장
    const data = {
        timestamp: new Date().toISOString(),
        price: price,
        stock: stock,
        rating: rating
    };

    fs.writeFileSync('product-data.json', JSON.stringify(data, null, 2));

    // 6. 데이터가 정상적으로 수집되었는지 확인
    expect(price).toBeTruthy();
    expect(stock).toBeTruthy();
    expect(rating).toBeTruthy();
}); 