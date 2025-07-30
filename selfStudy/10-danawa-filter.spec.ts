/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const { test, expect } = require('@playwright/test');

class DanawaFilterTest {
  constructor(page) {
    this.page = page;
    this.baseUrl = 'https://prod.danawa.com/list/?cate=10248425';
  }

  // 페이지 로드 및 기본 설정
  async navigateToTVCategory() {
    await this.page.goto(this.baseUrl);

    try {
      // DOM이 로드될 때까지 대기
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // 제품 목록이 나타날 때까지 대기
      await this.page.waitForSelector('ul.product_list, .prod_item, [class*="product"]', {
        timeout: 15000,
        state: 'visible'
      });

      // 추가 안정화를 위한 짧은 대기
      await this.page.waitForTimeout(2000);

    } catch (error) {
      console.log('페이지 로딩 대기 중 오류:', error.message);
    }

    // 팝업 자동 처리
    await this.closePopupsIfExists();
  }
  baseUrl(baseUrl: any) {
    throw new Error('Method not implemented.');
  }

  async closePopupsIfExists() {
    const popupSelectors = [
      'button:has-text("닫기")',
      'button:has-text("취소")',
      '[class*="popup"] button[class*="close"]',
      '[class*="layer"] button[class*="close"]'
    ];

    for (const selector of popupSelectors) {
      try {
        const popup = this.page.locator(selector).first();
        if (await popup.isVisible({ timeout: 2000 })) {
          await popup.click();
          await this.page.waitForTimeout(500);
        }
      } catch (error) {
        // 팝업이 없으면 무시
      }
    }
  }

  // 제조사별 필터 수집
  async getBrandFilters() {
    try {
      console.log('=== 제조사별 필터 수집 시작 ===');

      // 제조사별 필터 섹션 찾기
      const brandSection = this.page.locator('dl.spec_item.spec_item_bg.makerBrandArea');

      // 섹션이 존재하는지 확인
      const sectionExists = await brandSection.count();
      if (sectionExists === 0) {
        console.log('제조사별 필터 섹션을 찾을 수 없습니다.');
        return [];
      }

      console.log('제조사별 필터 섹션 발견');

      // 체크박스 찾기
      const brandCheckboxes = brandSection.locator('input[type="checkbox"][id^="searchMakerRep"]');
      const checkboxCount = await brandCheckboxes.count();

      if (checkboxCount > 0) {
        const brands = [];
        console.log(`제조사별 체크박스 ${checkboxCount}개 발견`);

        // 처음 10개만 수집
        const maxBrands = Math.min(10, checkboxCount);

        for (let i = 0; i < maxBrands; i++) {
          try {
            const checkbox = brandCheckboxes.nth(i);
            const value = await checkbox.getAttribute('value');
            const id = await checkbox.getAttribute('id');

            // label 태그에서 텍스트 가져오기
            let label = '';
            try {
              const labelElement = checkbox.locator('xpath=..'); // 부모 label 태그
              if (await labelElement.count() > 0) {
                label = await labelElement.textContent();
              }
            } catch (error) {
              console.log(`브랜드 ${i + 1} 라벨 추출 실패: ${error.message}`);
            }

            if (value && label) {
              brands.push({
                value,
                label: label.trim(),
                element: checkbox,
                id
              });
              console.log(`제조사 추가: ${label.trim()} (${value})`);
            } else {
              console.log(`브랜드 ${i + 1}: value=${value}, label=${label}`);
            }
          } catch (error) {
            console.log(`브랜드 ${i + 1} 정보 추출 실패: ${error.message}`);
          }
        }

        console.log(`총 ${brands.length}개의 제조사 필터 수집 완료`);
        return brands;
      } else {
        console.log('제조사별 체크박스를 찾을 수 없습니다.');
        return [];
      }
    } catch (error) {
      console.log('제조사별 필터 수집 실패:', error.message);
      return [];
    }
  }

  // 제조사 필터 적용
  async applyBrandFilter(brandOption) {
    try {
      console.log(`제조사 필터 적용: ${brandOption.label} (${brandOption.value})`);

      // 체크박스 클릭
      await brandOption.element.check();
      console.log(`체크박스 클릭 완료: ${brandOption.label}`);

      // 필터 적용 후 충분한 대기 (검색 결과 새로고침 대기)
      console.log('검색 결과 새로고침 대기 중...');
      await this.page.waitForTimeout(5000);

      // 추가로 제품 목록이 업데이트되었는지 확인
      await this.page.waitForSelector('ul.product_list li:not(.prod_ad_item)', { timeout: 10000 });
      console.log('검색 결과 새로고침 완료');

      // 필터 적용 확인
      await expect(brandOption.element).toBeChecked();

      // 필터 적용 후 결과 검증
      console.log(`\n=== 필터 검증: ${brandOption.label} ===`);
      console.log(`필터 정보: label="${brandOption.label}", value="${brandOption.value}"`);

      const results = await this.getSearchResults();
      const filteredResults = results.filter(product =>
        product.brand.toLowerCase().includes(brandOption.label.toLowerCase()) ||
        product.name.toLowerCase().includes(brandOption.label.toLowerCase())
      );

      console.log(`필터 적용 후 결과: ${results.length}개 중 ${filteredResults.length}개가 ${brandOption.label} 제품`);

      // 필터링된 제품들의 브랜드 분포 출력
      const brandDistribution = {};
      results.forEach(product => {
        const brand = product.brand || '알 수 없음';
        brandDistribution[brand] = (brandDistribution[brand] || 0) + 1;
      });

      console.log('📊 브랜드별 분포:');
      Object.entries(brandDistribution)
        .sort(([, a], [, b]) => b - a)
        .forEach(([brand, count]) => {
          console.log(`   ${brand}: ${count}개`);
        });

      if (filteredResults.length === 0) {
        console.log('⚠️ 경고: 필터 적용 후 해당 브랜드 제품이 없습니다!');
      }

      return {
        type: 'brand',
        label: brandOption.label,
        value: brandOption.value
      };
    } catch (error) {
      console.log('제조사 필터 적용 실패:', error.message);
      throw error;
    }
  }

  // 검색 결과 수집
  async getSearchResults() {
    try {
      console.log('=== 검색 결과 수집 시작 ===');

      // 가격비교 가능한 검색결과 개수 확인
      let totalCount = 0;
      const compareTab = this.page.locator('a.tab_link.tab_compare .list_num');
      if (await compareTab.count() > 0) {
        const compareText = await compareTab.textContent();
        const match = compareText?.match(/\((\d+(?:,\d+)*)\)/);
        if (match) {
          totalCount = parseInt(match[1].replace(/,/g, ''));
          console.log(`가격비교 가능한 검색결과: ${totalCount.toLocaleString()}개`);
        }
      }

      // 제품 목록 대기
      await this.page.waitForSelector('ul.product_list', { timeout: 10000 });

      // 제품 아이템들 찾기 (광고 제외 - 포괄적 필터링)
      const allProductItems = this.page.locator('ul.product_list:not([class*="ad_point"]) li:not([class*="prod_ad_item"]):not([id*="adSmart"]):not([id*="adPoint"]):not([id*="adFocus"]):not([class*="ad-"]):not([class*="advertisement"]):not([class*="ad_item"])');
      const allItemCount = await allProductItems.count();

      console.log(`광고 제외된 전체 li 요소: ${allItemCount}개`);

      // 유효한 제품만 필터링 (spec-box가 있는 경우만)
      const validProductItems = this.page.locator('ul.product_list:not([class*="ad_point"]) li:not([class*="prod_ad_item"]):not([id*="adSmart"]):not([id*="adPoint"]):not([id*="adFocus"]):not([class*="ad-"]):not([class*="advertisement"]):not([class*="ad_item"])').filter({ has: this.page.locator('.spec-box') });
      const itemCount = await validProductItems.count();

      console.log(`유효한 제품 (spec-box 포함): ${itemCount}개`);

      // 디버깅: 모든 li 요소 확인
      const allItems = this.page.locator('ul.product_list li');
      const totalItemCount = await allItems.count();
      console.log(`전체 li 요소 개수: ${totalItemCount}개`);

      // 광고 영역 제외한 li 요소 확인
      const nonAdItems = this.page.locator('ul.product_list:not([class*="ad_point"]) li');
      const nonAdItemCount = await nonAdItems.count();
      console.log(`광고 영역 제외한 li 요소 개수: ${nonAdItemCount}개`);

      // 광고 요소들 확인 (포괄적)
      const adItems = this.page.locator('ul.product_list li[class*="prod_ad_item"], ul.product_list li[id*="adSmart"], ul.product_list li[id*="adPoint"], ul.product_list li[id*="adFocus"], ul.product_list li[class*="ad-"], ul.product_list li[class*="advertisement"], ul.product_list li[class*="ad_item"]');
      const adItemCount = await adItems.count();
      console.log(`광고 요소 개수: ${adItemCount}개`);

      // 광고 div 요소들도 확인
      const adDivs = this.page.locator('ul.product_list div[id*="adPoint"], ul.product_list div[id*="adFocus"], ul.product_list div[class*="ad-"]');
      const adDivCount = await adDivs.count();
      console.log(`광고 div 요소 개수: ${adDivCount}개`);

      const results = [];
      // 유효한 제품만 수집 (spec-box가 있는 제품만)
      const maxItems = itemCount;

      for (let i = 0; i < maxItems; i++) {
        try {
          const item = validProductItems.nth(i);

          // spec-box 존재 여부 재확인
          const specBox = item.locator('.spec-box');
          if (await specBox.count() === 0) {
            console.log(`제품 ${i + 1}: spec-box 없음, 건너뜀`);
            continue;
          }

          // 제품명 추출
          let name = '';
          try {
            const nameElement = item.locator('.prod_name a');
            if (await nameElement.count() > 0) {
              name = await nameElement.textContent();
            }
          } catch (error) {
            // 무시
          }

          // 전체 텍스트에서 가격 정보 추출
          let price = '';
          try {
            // 제품 항목의 모든 텍스트 가져오기
            const allText = await item.textContent();
            console.log(`\n=== 제품 ${i + 1} 전체 텍스트 ===`);
            console.log(allText || '텍스트 없음');
            console.log(`=== 제품 ${i + 1} 텍스트 끝 ===\n`);

            // 가격 패턴 찾기 (숫자,숫자,숫자원 또는 숫자원)
            const pricePatterns = [
              /(\d{1,3}(?:,\d{3})*)원/g,  // 1,074,000원
              /(\d+)원/g,                  // 1074000원
              /(\d{1,3}(?:,\d{3})*)\s*원/g, // 1,074,000 원
              /(\d+)\s*원/g                // 1074000 원
            ];

            for (const pattern of pricePatterns) {
              const matches = allText?.match(pattern);
              if (matches && matches.length > 0) {
                // 가장 큰 숫자를 가격으로 선택 (보통 가장 큰 숫자가 가격)
                const prices = matches.map(match => {
                  const numStr = match.replace(/[^\d]/g, '');
                  return parseInt(numStr);
                });
                const maxPrice = Math.max(...prices);
                price = `${maxPrice.toLocaleString()}원`;
                console.log(`가격 패턴 찾음 (${pattern}): ${price}`);
                break;
              }
            }

            if (!price) {
              console.log(`제품 ${i + 1} 가격 패턴을 찾을 수 없음`);
            }
          } catch (error) {
            console.log(`제품 ${i + 1} 텍스트 추출 오류: ${error.message}`);
          }

          if (name) {
            // 브랜드 추출 (제품명에서 첫 번째 단어)
            let brand = '';
            const brandMatch = name.trim().match(/^([가-힣A-Za-z]+)/);
            if (brandMatch) {
              brand = brandMatch[1];
            }

            // 스펙 정보 추출 (간단한 정보만)
            let specs = '';
            try {
              const specElement = item.locator('.spec_list');
              if (await specElement.count() > 0) {
                const specText = await specElement.textContent();
                if (specText) {
                  // 첫 100자만 추출
                  specs = specText.trim().substring(0, 100) + (specText.length > 100 ? '...' : '');
                }
              }
            } catch (error) {
              // 무시
            }

            results.push({
              name: name.trim(),
              brand: brand,
              price: price?.trim() || '가격 정보 없음',
              specs: specs,
              index: i + 1
            });
            console.log(`제품 ${i + 1}: ${brand} ${name.trim()} - ${price?.trim() || '가격 정보 없음'}`);


          }
        } catch (error) {
          console.log(`제품 ${i + 1} 정보 추출 실패: ${error.message}`);
        }
      }

      console.log(`총 ${results.length}개의 제품 정보 수집 완료`);

      // 수집된 제품 정보 요약
      console.log('\n=== 수집된 제품 요약 ===');
      console.log(`- 총 제품 수: ${results.length}개`);

      // 가격 정보가 있는 제품 수 계산
      const productsWithPrice = results.filter(p => p.price && p.price !== '가격 정보 없음').length;
      console.log(`- 가격 정보 있는 제품: ${productsWithPrice}개`);
      console.log(`- 가격 정보 없는 제품: ${results.length - productsWithPrice}개`);

      // 첫 페이지 결과를 보기 좋게 출력
      console.log('\n=== 첫 페이지 검색 결과 (최대 30개) ===');
      results.forEach((product, index) => {
        console.log(`${index + 1}. ${product.brand} ${product.name}`);
        console.log(`   💰 가격: ${product.price}`);
        if (product.specs) {
          console.log(`   📋 스펙: ${product.specs.substring(0, 100)}${product.specs.length > 100 ? '...' : ''}`);
        }
        console.log(''); // 빈 줄로 구분
      });

      // 검색결과 총 개수 출력
      console.log('\n=== 검색결과 요약 ===');
      console.log(`📊 유효한 제품 (spec-box 포함): ${results.length}개`);
      console.log(`📊 광고 제외된 전체 li 요소: ${allItemCount}개`);
      if (totalCount) {
        console.log(`📊 전체 가격비교 가능 제품: ${totalCount.toLocaleString()}개`);
      }
      console.log(`📊 필터링 비율: ${allItemCount > 0 ? ((results.length / allItemCount) * 100).toFixed(1) : 0}%`);

      return results;
    } catch (error) {
      console.log('검색 결과 수집 실패:', error.message);
      return [];
    }
  }
}

// 테스트 실행
test.describe('다나와 TV 필터링 테스트', () => {
  let filterTest;

  test.beforeEach(async ({ page }) => {
    filterTest = new DanawaFilterTest(page);
    await filterTest.navigateToTVCategory();

    // 페이지 로딩 확인
    await expect(page).toHaveTitle(/TV|텔레비전/);
    await expect(page.locator('dl.spec_item.spec_item_bg.makerBrandArea')).toBeVisible();
  });

  test('제조사별 필터 확인 및 적용', async () => {
    // 제조사별 필터 수집
    const brands = await filterTest.getBrandFilters();
    expect(brands.length).toBeGreaterThan(0);

    console.log('\n=== 사용 가능한 제조사 ===');
    brands.slice(0, 5).forEach(brand =>
      console.log(`  - ${brand.label} (${brand.value})`)
    );

    // 첫 번째 제조사 선택
    const selectedBrand = brands[0];
    console.log(`\n선택된 제조사: ${selectedBrand.label} (${selectedBrand.value})`);

    // 필터 적용
    const appliedFilter = await filterTest.applyBrandFilter(selectedBrand);

    // 결과 수집
    const results = await filterTest.getSearchResults();
    expect(results.length).toBeGreaterThan(0);

    console.log(`\n=== 필터 적용 결과 ===`);
    console.log(`적용된 필터: ${appliedFilter.label}`);
    console.log(`검색 결과: ${results.length}개 제품`);

    // 브라우저를 열어둔 상태로 유지 (10초)
    await filterTest.page.waitForTimeout(10000);
  });
});