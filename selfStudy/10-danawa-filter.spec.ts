const { test, expect } = require('@playwright/test');

class DanawaFilterTest {
  constructor(page) {
    this.page = page;
    this.baseUrl = 'https://prod.danawa.com/list/?cate=10248425';
  }

  // 페이지 로드 및 기본 설정
  async navigateToTVCategory() {
    await this.page.goto(this.baseUrl);

    // networkidle 대신 더 안정적인 대기 방법들 사용
    try {
      // 1. DOM이 로드될 때까지 대기
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // 2. 특정 요소가 나타날 때까지 대기 (더 구체적)
      await this.page.waitForSelector('ul.product_list, .prod_item, [class*="product"]', {
        timeout: 15000,
        state: 'visible'
      });

      // 3. 추가 안정화를 위한 짧은 대기
      await this.page.waitForTimeout(2000);

    } catch (error) {
      console.log('페이지 로딩 대기 중 오류:', error.message);
      // 오류가 발생해도 계속 진행
    }

    // 팝업 자동 처리
    await this.closePopupsIfExists();
  }

  // 대안적인 대기 방법들 (필요시 사용)
  async alternativeWaitMethods() {
    // 방법 1: 특정 텍스트가 나타날 때까지 대기
    // await this.page.waitForFunction(() => {
    //   return document.body.textContent.includes('제조회사') || 
    //          document.body.textContent.includes('TV');
    // }, { timeout: 15000 });

    // 방법 2: 네트워크 요청 완료 대기 (특정 요청만)
    // await this.page.waitForResponse(response => 
    //   response.url().includes('danawa.com') && 
    //   response.status() === 200, 
    //   { timeout: 10000 }
    // );

    // 방법 3: 여러 요소 중 하나라도 나타나면 진행
    // await this.page.waitForSelector([
    //   'ul.product_list',
    //   '.prod_item',
    //   '[class*="product"]',
    //   '[class*="item"]'
    // ].join(', '), { timeout: 15000 });

    // 방법 4: 페이지가 완전히 로드될 때까지 폴링
    // await this.page.waitForFunction(() => {
    //   return document.readyState === 'complete' && 
    //          !document.querySelector('.loading, .spinner');
    // }, { timeout: 20000 });
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

  // 사용 가능한 필터 조건들을 수집
  async getAvailableFilters() {
    const filters = {};

    // 모든 필터 섹션 수집
    await this.collectAllFilterSections(filters);

    // 브랜드 필터 수집
    await this.collectBrandFilters(filters);

    // 화면크기 필터 수집
    await this.collectScreenSizeFilters(filters);

    // 해상도 필터 수집
    await this.collectResolutionFilters(filters);

    // 가격 필터 수집
    await this.collectPriceFilters(filters);

    // 추가 필터들 수집
    await this.collectAdditionalFilters(filters);

    return filters;
  }

  // 모든 필터 섹션 수집 (디버깅용)
  async collectAllFilterSections(filters) {
    try {
      console.log('=== 모든 필터 섹션 분석 ===');

      // 모든 dl.spec_item_bg 요소 찾기
      const allFilterSections = this.page.locator('dl.spec_item_bg');
      const sectionCount = await allFilterSections.count();

      console.log(`총 필터 섹션 개수: ${sectionCount}개`);

      filters.allSections = [];

      for (let i = 0; i < Math.min(sectionCount, 15); i++) { // 최대 15개만 분석
        try {
          const section = allFilterSections.nth(i);

          // 섹션 제목 가져오기
          const titleElement = section.locator('dt.item_dt');
          let title = '';
          if (await titleElement.count() > 0) {
            title = await titleElement.textContent();
          }

          // 체크박스 개수 확인
          const checkboxes = section.locator('input[type="checkbox"]');
          const checkboxCount = await checkboxes.count();

          // 라디오 버튼 개수 확인
          const radioButtons = section.locator('input[type="radio"]');
          const radioCount = await radioButtons.count();

          // 입력 필드 개수 확인
          const inputs = section.locator('input[type="text"], input[type="number"]');
          const inputCount = await inputs.count();

          const sectionInfo = {
            index: i + 1,
            title: title?.trim() || `섹션 ${i + 1}`,
            checkboxCount,
            radioCount,
            inputCount,
            totalElements: checkboxCount + radioCount + inputCount
          };

          filters.allSections.push(sectionInfo);
          console.log(`섹션 ${i + 1}: "${sectionInfo.title}" (체크박스: ${checkboxCount}, 라디오: ${radioCount}, 입력: ${inputCount})`);

        } catch (error) {
          console.log(`섹션 ${i + 1} 분석 실패: ${error.message}`);
        }
      }

      console.log('=== 필터 섹션 분석 완료 ===');

    } catch (error) {
      console.log('필터 섹션 분석 실패:', error.message);
    }
  }

  // 추가 필터들 수집
  async collectAdditionalFilters(filters) {
    try {
      console.log('=== 추가 필터 수집 ===');

      // 1. 해상도 필터 (이미 있지만 다른 방법으로도 시도)
      await this.collectResolutionFilters(filters);

      // 2. 패널 타입 필터
      await this.collectPanelTypeFilters(filters);

      // 3. 스마트 TV 기능 필터
      await this.collectSmartTVFilters(filters);

      // 4. HDR 지원 필터
      await this.collectHDRFilters(filters);

      // 5. HDMI 포트 수 필터
      await this.collectHDMIFilters(filters);

      // 6. USB 포트 수 필터
      await this.collectUSBFilters(filters);

      console.log('=== 추가 필터 수집 완료 ===');

    } catch (error) {
      console.log('추가 필터 수집 실패:', error.message);
    }
  }

  // 패널 타입 필터 수집
  async collectPanelTypeFilters(filters) {
    try {
      const panelSection = this.page.locator('dl.spec_item_bg').filter({ hasText: /패널|LCD|OLED|QLED|LED/ });
      const panelCheckboxes = panelSection.locator('input[type="checkbox"]');
      const checkboxCount = await panelCheckboxes.count();

      if (checkboxCount > 0) {
        filters.panelType = [];
        console.log(`패널 타입 체크박스 ${checkboxCount}개 발견`);

        for (let i = 0; i < Math.min(5, checkboxCount); i++) {
          try {
            const checkbox = panelCheckboxes.nth(i);
            const value = await checkbox.getAttribute('value');
            const id = await checkbox.getAttribute('id');

            let label = '';
            try {
              const labelElement = checkbox.locator('xpath=..');
              if (await labelElement.count() > 0) {
                label = await labelElement.textContent();
              }
            } catch (error) {
              // 무시
            }

            if (value && label) {
              filters.panelType.push({
                value,
                label: label.trim(),
                element: checkbox,
                id
              });
              console.log(`패널 타입 추가: ${label.trim()} (${value})`);
            }
          } catch (error) {
            console.log(`패널 타입 ${i + 1} 정보 추출 실패: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('패널 타입 필터 수집 실패:', error.message);
    }
  }

  // 스마트 TV 기능 필터 수집
  async collectSmartTVFilters(filters) {
    try {
      const smartSection = this.page.locator('dl.spec_item_bg').filter({ hasText: /스마트|인터넷|앱/ });
      const smartCheckboxes = smartSection.locator('input[type="checkbox"]');
      const checkboxCount = await smartCheckboxes.count();

      if (checkboxCount > 0) {
        filters.smartTV = [];
        console.log(`스마트 TV 체크박스 ${checkboxCount}개 발견`);

        for (let i = 0; i < Math.min(5, checkboxCount); i++) {
          try {
            const checkbox = smartCheckboxes.nth(i);
            const value = await checkbox.getAttribute('value');
            const id = await checkbox.getAttribute('id');

            let label = '';
            try {
              const labelElement = checkbox.locator('xpath=..');
              if (await labelElement.count() > 0) {
                label = await labelElement.textContent();
              }
            } catch (error) {
              // 무시
            }

            if (value && label) {
              filters.smartTV.push({
                value,
                label: label.trim(),
                element: checkbox,
                id
              });
              console.log(`스마트 TV 추가: ${label.trim()} (${value})`);
            }
          } catch (error) {
            console.log(`스마트 TV ${i + 1} 정보 추출 실패: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('스마트 TV 필터 수집 실패:', error.message);
    }
  }

  // HDR 지원 필터 수집
  async collectHDRFilters(filters) {
    try {
      const hdrSection = this.page.locator('dl.spec_item_bg').filter({ hasText: /HDR/ });
      const hdrCheckboxes = hdrSection.locator('input[type="checkbox"]');
      const checkboxCount = await hdrCheckboxes.count();

      if (checkboxCount > 0) {
        filters.hdr = [];
        console.log(`HDR 체크박스 ${checkboxCount}개 발견`);

        for (let i = 0; i < Math.min(5, checkboxCount); i++) {
          try {
            const checkbox = hdrCheckboxes.nth(i);
            const value = await checkbox.getAttribute('value');
            const id = await checkbox.getAttribute('id');

            let label = '';
            try {
              const labelElement = checkbox.locator('xpath=..');
              if (await labelElement.count() > 0) {
                label = await labelElement.textContent();
              }
            } catch (error) {
              // 무시
            }

            if (value && label) {
              filters.hdr.push({
                value,
                label: label.trim(),
                element: checkbox,
                id
              });
              console.log(`HDR 추가: ${label.trim()} (${value})`);
            }
          } catch (error) {
            console.log(`HDR ${i + 1} 정보 추출 실패: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('HDR 필터 수집 실패:', error.message);
    }
  }

  // HDMI 포트 수 필터 수집
  async collectHDMIFilters(filters) {
    try {
      const hdmiSection = this.page.locator('dl.spec_item_bg').filter({ hasText: /HDMI/ });
      const hdmiCheckboxes = hdmiSection.locator('input[type="checkbox"]');
      const checkboxCount = await hdmiCheckboxes.count();

      if (checkboxCount > 0) {
        filters.hdmi = [];
        console.log(`HDMI 체크박스 ${checkboxCount}개 발견`);

        for (let i = 0; i < Math.min(5, checkboxCount); i++) {
          try {
            const checkbox = hdmiCheckboxes.nth(i);
            const value = await checkbox.getAttribute('value');
            const id = await checkbox.getAttribute('id');

            let label = '';
            try {
              const labelElement = checkbox.locator('xpath=..');
              if (await labelElement.count() > 0) {
                label = await labelElement.textContent();
              }
            } catch (error) {
              // 무시
            }

            if (value && label) {
              filters.hdmi.push({
                value,
                label: label.trim(),
                element: checkbox,
                id
              });
              console.log(`HDMI 추가: ${label.trim()} (${value})`);
            }
          } catch (error) {
            console.log(`HDMI ${i + 1} 정보 추출 실패: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('HDMI 필터 수집 실패:', error.message);
    }
  }

  // USB 포트 수 필터 수집
  async collectUSBFilters(filters) {
    try {
      const usbSection = this.page.locator('dl.spec_item_bg').filter({ hasText: /USB/ });
      const usbCheckboxes = usbSection.locator('input[type="checkbox"]');
      const checkboxCount = await usbCheckboxes.count();

      if (checkboxCount > 0) {
        filters.usb = [];
        console.log(`USB 체크박스 ${checkboxCount}개 발견`);

        for (let i = 0; i < Math.min(5, checkboxCount); i++) {
          try {
            const checkbox = usbCheckboxes.nth(i);
            const value = await checkbox.getAttribute('value');
            const id = await checkbox.getAttribute('id');

            let label = '';
            try {
              const labelElement = checkbox.locator('xpath=..');
              if (await labelElement.count() > 0) {
                label = await labelElement.textContent();
              }
            } catch (error) {
              // 무시
            }

            if (value && label) {
              filters.usb.push({
                value,
                label: label.trim(),
                element: checkbox,
                id
              });
              console.log(`USB 추가: ${label.trim()} (${value})`);
            }
          } catch (error) {
            console.log(`USB ${i + 1} 정보 추출 실패: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('USB 필터 수집 실패:', error.message);
    }
  }

  async collectBrandFilters(filters) {
    try {
      // 실제 HTML 구조에 따른 브랜드 필터 수집
      const brandSection = this.page.locator('dl.spec_item_bg.makerBrandArea');
      const brandCheckboxes = brandSection.locator('input[type="checkbox"][id^="searchMakerRep"]');
      const checkboxCount = await brandCheckboxes.count();

      if (checkboxCount > 0) {
        filters.brand = [];
        console.log(`브랜드 체크박스 ${checkboxCount}개 발견`);

        // 처음 10개만 수집 (성능 고려)
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
              // 무시
            }

            if (value && label) {
              filters.brand.push({
                value,
                label: label.trim(),
                element: checkbox,
                id
              });
              console.log(`브랜드 추가: ${label.trim()} (${value})`);
            }
          } catch (error) {
            console.log(`브랜드 ${i + 1} 정보 추출 실패: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('브랜드 필터 수집 실패:', error.message);
    }
  }

  async collectScreenSizeFilters(filters) {
    try {
      // 화면크기 필터 섹션 찾기
      const sizeSection = this.page.locator('dl.spec_item_bg').filter({ hasText: '화면크기' });
      const sizeCheckboxes = sizeSection.locator('input[type="checkbox"]');
      const checkboxCount = await sizeCheckboxes.count();

      if (checkboxCount > 0) {
        filters.screenSize = [];
        console.log(`화면크기 체크박스 ${checkboxCount}개 발견`);

        for (let i = 0; i < Math.min(5, checkboxCount); i++) {
          try {
            const checkbox = sizeCheckboxes.nth(i);
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
              // 무시
            }

            if (value && label) {
              filters.screenSize.push({
                value,
                label: label.trim(),
                element: checkbox,
                id
              });
              console.log(`화면크기 추가: ${label.trim()} (${value})`);
            }
          } catch (error) {
            console.log(`화면크기 ${i + 1} 정보 추출 실패: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('화면크기 필터 수집 실패:', error.message);
    }
  }

  async collectResolutionFilters(filters) {
    try {
      // 해상도 필터 섹션 찾기
      const resolutionSection = this.page.locator('dl.spec_item_bg').filter({ hasText: '해상도' });
      const resolutionCheckboxes = resolutionSection.locator('input[type="checkbox"]');
      const checkboxCount = await resolutionCheckboxes.count();

      if (checkboxCount > 0) {
        filters.resolution = [];
        console.log(`해상도 체크박스 ${checkboxCount}개 발견`);

        for (let i = 0; i < Math.min(5, checkboxCount); i++) {
          try {
            const checkbox = resolutionCheckboxes.nth(i);
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
              // 무시
            }

            if (value && label) {
              filters.resolution.push({
                value,
                label: label.trim(),
                element: checkbox,
                id
              });
              console.log(`해상도 추가: ${label.trim()} (${value})`);
            }
          } catch (error) {
            console.log(`해상도 ${i + 1} 정보 추출 실패: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('해상도 필터 수집 실패:', error.message);
    }
  }

  async collectPriceFilters(filters) {
    try {
      const minPriceInput = this.page.getByPlaceholder('최소가격');
      const maxPriceInput = this.page.getByPlaceholder('최대가격');

      if (await minPriceInput.count() > 0 && await maxPriceInput.count() > 0) {
        filters.priceRange = {
          minInput: minPriceInput,
          maxInput: maxPriceInput,
          applyButton: this.page.getByRole('button', { name: /적용|검색/ })
        };
      }
    } catch (error) {
      console.log('가격 필터 수집 실패:', error.message);
    }
  }

  // 특정 필터 적용
  async applyBrandFilter(brandOption) {
    console.log(`브랜드 필터 적용: ${brandOption.label}`);

    await brandOption.element.check();
    await this.page.waitForLoadState('networkidle');

    // 필터 적용 확인
    await expect(brandOption.element).toBeChecked();

    return { type: 'brand', value: brandOption };
  }

  async applyScreenSizeFilter(sizeOption) {
    console.log(`화면크기 필터 적용: ${sizeOption.label}`);

    await sizeOption.element.check();
    await this.page.waitForLoadState('networkidle');

    // 필터 적용 확인
    await expect(sizeOption.element).toBeChecked();

    return { type: 'screenSize', value: sizeOption };
  }

  async applyResolutionFilter(resolutionOption) {
    console.log(`해상도 필터 적용: ${resolutionOption.label}`);

    await resolutionOption.element.check();
    await this.page.waitForLoadState('networkidle');

    // 필터 적용 확인
    await expect(resolutionOption.element).toBeChecked();

    return { type: 'resolution', value: resolutionOption };
  }

  async applyPriceRangeFilter(minPrice, maxPrice) {
    console.log(`가격 범위 필터 적용: ${minPrice?.toLocaleString() || '무제한'}원 ~ ${maxPrice?.toLocaleString() || '무제한'}원`);

    const { minInput, maxInput, applyButton } = this.filters.priceRange;

    if (minPrice) {
      await minInput.fill(minPrice.toString());
    }

    if (maxPrice) {
      await maxInput.fill(maxPrice.toString());
    }

    await applyButton.click();
    await this.page.waitForLoadState('networkidle');

    return { type: 'priceRange', value: { min: minPrice, max: maxPrice } };
  }

  // 검색 결과 수집
  async getSearchResults() {
    // 결과 로딩 완료 대기
    await this.page.waitForSelector('ul.product_list', { timeout: 10000 });

    const results = [];
    const productItems = this.page.locator('ul.product_list li');

    const itemCount = await productItems.count();
    const maxItems = Math.min(itemCount, 10);

    console.log(`총 ${itemCount}개 상품 중 ${maxItems}개 수집`);

    for (let i = 0; i < maxItems; i++) {
      try {
        const item = productItems.nth(i);
        const productData = await this.extractProductInfo(item);

        if (Object.keys(productData).length > 1) { // 최소한의 데이터가 있는 경우만
          results.push(productData);
        }
      } catch (error) {
        console.log(`상품 ${i + 1} 정보 추출 실패:`, error.message);
      }
    }

    return results;
  }

  async extractProductInfo(item) {
    const productData = {};

    try {
      // 상품명 추출
      const nameLink = item.getByRole('link').first();
      if (await nameLink.count() > 0) {
        productData.name = await nameLink.textContent();
        productData.name = productData.name.trim();

        // 브랜드 추출 (상품명 첫 번째 단어)
        const brandMatch = productData.name.match(/^([가-힣A-Za-z]+)/);
        if (brandMatch) {
          productData.brand = brandMatch[1];
        }
      }

      // 가격 추출
      const priceElement = item.getByText(/\d{1,3}(,\d{3})*원/).first();
      if (await priceElement.count() > 0) {
        const priceText = await priceElement.textContent();
        const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)원/);
        if (priceMatch) {
          productData.price = parseInt(priceMatch[1].replace(/,/g, ''));
        }
      }

      // 스펙 정보 추출
      const specElements = item.locator('text=/인치|4K|UHD|FHD|HD/').all();
      const specTexts = await Promise.all(
        (await specElements).map(el => el.textContent())
      );

      const fullSpecText = specTexts.join(' ');

      if (fullSpecText) {
        // 화면크기 추출
        const sizeMatch = fullSpecText.match(/(\d+)인치/);
        if (sizeMatch) {
          productData.screenSize = parseInt(sizeMatch[1]);
        }

        // 해상도 추출
        if (fullSpecText.includes('4K') || fullSpecText.includes('UHD')) {
          productData.resolution = '4K';
        } else if (fullSpecText.includes('FHD')) {
          productData.resolution = 'FHD';
        } else if (fullSpecText.includes('HD')) {
          productData.resolution = 'HD';
        }
      }

    } catch (error) {
      console.log('상품 정보 추출 중 오류:', error.message);
    }

    return productData;
  }

  // 필터 조건과 결과 일치성 검증
  validateFilterResults(appliedFilters, searchResults) {
    const validationResults = {
      isValid: true,
      totalProducts: searchResults.length,
      details: []
    };

    for (const filter of appliedFilters) {
      const validation = this.validateSingleFilter(filter, searchResults);
      validationResults.details.push(validation);

      if (!validation.isValid) {
        validationResults.isValid = false;
      }
    }

    return validationResults;
  }

  validateSingleFilter(filter, searchResults) {
    const validation = {
      filterType: filter.type,
      filterValue: filter.value,
      isValid: true,
      validCount: 0,
      invalidCount: 0,
      invalidItems: []
    };

    for (const result of searchResults) {
      let isProductValid = false;

      switch (filter.type) {
        case 'brand':
          isProductValid = !result.brand ||
            result.brand.toLowerCase().includes(filter.value.label.toLowerCase()) ||
            result.name.toLowerCase().includes(filter.value.label.toLowerCase());
          break;

        case 'screenSize':
          const expectedSize = parseInt(filter.value.label.match(/\d+/)?.[0]);
          isProductValid = !result.screenSize ||
            !expectedSize ||
            Math.abs(result.screenSize - expectedSize) <= 2;
          break;

        case 'resolution':
          isProductValid = !result.resolution ||
            result.resolution.toLowerCase().includes(filter.value.label.toLowerCase());
          break;

        case 'priceRange':
          const { min, max } = filter.value;
          isProductValid = !result.price ||
            ((!min || result.price >= min) && (!max || result.price <= max));
          break;

        default:
          isProductValid = true;
      }

      if (isProductValid) {
        validation.validCount++;
      } else {
        validation.invalidCount++;
        validation.invalidItems.push({
          name: result.name,
          reason: this.getValidationReason(filter, result)
        });
      }
    }

    validation.isValid = validation.invalidCount === 0;
    validation.accuracy = validation.validCount / searchResults.length;

    return validation;
  }

  getValidationReason(filter, result) {
    switch (filter.type) {
      case 'brand':
        return `예상 브랜드: ${filter.value.label}, 실제: ${result.brand || '알 수 없음'}`;
      case 'screenSize':
        return `예상 크기: ${filter.value.label}, 실제: ${result.screenSize || '알 수 없음'}인치`;
      case 'resolution':
        return `예상 해상도: ${filter.value.label}, 실제: ${result.resolution || '알 수 없음'}`;
      case 'priceRange':
        return `가격 범위: ${filter.value.min || 0}~${filter.value.max || '무제한'}원, 실제: ${result.price?.toLocaleString() || '알 수 없음'}원`;
      default:
        return '알 수 없는 오류';
    }
  }

  // 결과 출력 헬퍼
  logValidationResults(validation) {
    console.log('\n=== 필터 검증 결과 ===');
    console.log(`전체 정확도: ${validation.isValid ? '✅ 통과' : '❌ 실패'} (${validation.totalProducts}개 상품)`);

    for (const detail of validation.details) {
      console.log(`\n${detail.filterType} 필터:`);
      console.log(`  - 정확도: ${(detail.accuracy * 100).toFixed(1)}% (${detail.validCount}/${detail.validCount + detail.invalidCount})`);
      console.log(`  - 상태: ${detail.isValid ? '✅ 통과' : '⚠️ 일부 불일치'}`);

      if (detail.invalidItems.length > 0) {
        console.log('  - 불일치 항목:');
        detail.invalidItems.slice(0, 3).forEach(item => {
          console.log(`    • ${item.name} (${item.reason})`);
        });
      }
    }
  }
}

// 테스트 케이스들
test.describe('다나와 TV 필터링 테스트', () => {
  let filterTest;

  test.beforeEach(async ({ page }) => {
    filterTest = new DanawaFilterTest(page);
    await filterTest.navigateToTVCategory();

    // 페이지 로딩 확인 (실제 HTML 구조에 맞게 수정)
    await expect(page).toHaveTitle(/TV|텔레비전/);
    await expect(page.locator('dl.spec_item_bg.makerBrandArea')).toBeVisible();
  });

  test('사용 가능한 필터 조건 확인', async () => {
    const filters = await filterTest.getAvailableFilters();

    console.log('\n=== 사용 가능한 필터 조건 ===');

    if (filters.brand?.length > 0) {
      console.log(`브랜드 필터: ${filters.brand.length}개`);
      filters.brand.slice(0, 3).forEach(brand =>
        console.log(`  - ${brand.label}`)
      );
    }

    if (filters.screenSize?.length > 0) {
      console.log(`화면크기 필터: ${filters.screenSize.length}개`);
      filters.screenSize.slice(0, 3).forEach(size =>
        console.log(`  - ${size.label}`)
      );
    }

    if (filters.resolution?.length > 0) {
      console.log(`해상도 필터: ${filters.resolution.length}개`);
      filters.resolution.slice(0, 3).forEach(resolution =>
        console.log(`  - ${resolution.label}`)
      );
    }

    if (filters.priceRange) {
      console.log('가격 범위 필터: 사용 가능');
    }

    // 최소 하나의 필터는 존재해야 함
    const totalFilters = Object.keys(filters).length;
    expect(totalFilters).toBeGreaterThan(0);

    console.log(`\n총 ${totalFilters}개 필터 타입 발견`);
  });

  test('브랜드 필터 정확성 검증', async () => {
    const filters = await filterTest.getAvailableFilters();

    // 브랜드 필터가 있는지 확인
    expect(filters.brand?.length).toBeGreaterThan(0);

    const selectedBrand = filters.brand[0];
    const appliedFilter = await filterTest.applyBrandFilter(selectedBrand);

    // 결과 수집
    const results = await filterTest.getSearchResults();
    expect(results.length).toBeGreaterThan(0);

    // 검증
    const validation = filterTest.validateFilterResults([appliedFilter], results);
    filterTest.logValidationResults(validation);

    // 80% 이상 정확도면 통과
    expect(validation.details[0].accuracy).toBeGreaterThan(0.8);
  });

  test('화면크기 필터 정확성 검증', async () => {
    const filters = await filterTest.getAvailableFilters();

    if (filters.screenSize?.length > 0) {
      const selectedSize = filters.screenSize[0];
      const appliedFilter = await filterTest.applyScreenSizeFilter(selectedSize);

      const results = await filterTest.getSearchResults();
      expect(results.length).toBeGreaterThan(0);

      const validation = filterTest.validateFilterResults([appliedFilter], results);
      filterTest.logValidationResults(validation);

      // 화면크기는 70% 이상 정확도면 통과 (정보 추출이 어려울 수 있음)
      expect(validation.details[0].accuracy).toBeGreaterThan(0.7);
    } else {
      test.skip('화면크기 필터가 없습니다.');
    }
  });

  test('가격 범위 필터 정확성 검증', async () => {
    const filters = await filterTest.getAvailableFilters();

    if (filters.priceRange) {
      filterTest.filters = filters; // 필터 정보 저장

      const minPrice = 500000; // 50만원
      const maxPrice = 1500000; // 150만원

      const appliedFilter = await filterTest.applyPriceRangeFilter(minPrice, maxPrice);

      const results = await filterTest.getSearchResults();
      expect(results.length).toBeGreaterThan(0);

      const validation = filterTest.validateFilterResults([appliedFilter], results);
      filterTest.logValidationResults(validation);

      // 가격 정보는 70% 이상 정확도면 통과
      expect(validation.details[0].accuracy).toBeGreaterThan(0.7);
    } else {
      test.skip('가격 범위 필터가 없습니다.');
    }
  });

  test('복합 필터 조합 테스트', async () => {
    const filters = await filterTest.getAvailableFilters();
    const appliedFilters = [];

    // 브랜드 필터 적용
    if (filters.brand?.length > 0) {
      const brandFilter = await filterTest.applyBrandFilter(filters.brand[0]);
      appliedFilters.push(brandFilter);
    }

    // 화면크기 필터 추가 적용
    if (filters.screenSize?.length > 0) {
      const sizeFilter = await filterTest.applyScreenSizeFilter(filters.screenSize[0]);
      appliedFilters.push(sizeFilter);
    }

    expect(appliedFilters.length).toBeGreaterThan(0);

    const results = await filterTest.getSearchResults();
    console.log(`복합 필터 적용 후: ${results.length}개 상품`);

    const validation = filterTest.validateFilterResults(appliedFilters, results);
    filterTest.logValidationResults(validation);

    // 복합 필터는 개별 필터보다 엄격하지 않게 검증
    const avgAccuracy = validation.details.reduce((sum, detail) => sum + detail.accuracy, 0) / validation.details.length;
    expect(avgAccuracy).toBeGreaterThan(0.6);
  });

  test('필터 초기화 후 전체 결과 확인', async () => {
    const filters = await filterTest.getAvailableFilters();

    // 필터 적용
    if (filters.brand?.length > 0) {
      await filterTest.applyBrandFilter(filters.brand[0]);
    }

    // 필터링된 결과 수집
    const filteredResults = await filterTest.getSearchResults();
    const filteredCount = filteredResults.length;

    // 필터 초기화 (페이지 새로고침)
    await filterTest.navigateToTVCategory();

    // 전체 결과 수집
    const allResults = await filterTest.getSearchResults();
    const totalCount = allResults.length;

    console.log(`필터 적용 시: ${filteredCount}개, 전체: ${totalCount}개`);

    // 필터 적용 시 결과가 줄어들어야 함 (일반적으로)
    expect(filteredCount).toBeLessThanOrEqual(totalCount);

    // 모든 결과에 기본 정보가 있는지 확인
    const resultsWithName = allResults.filter(result => result.name);
    expect(resultsWithName.length).toBeGreaterThan(totalCount * 0.8); // 80% 이상
  });
});

// 설정 파일 (playwright.config.js) 예시
/*
module.exports = {
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
};
*/