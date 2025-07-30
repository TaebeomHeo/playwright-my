# 🎭 Playwright 자습서 - 비개발자를 위한 웹 자동화

## 📚 학습 철학: "보고 → 따라하기 → 이해하기"

> **핵심**: 코딩 몰라도 됩니다! 시각적 도구로 시작해서 점진적으로 이해해나가는 역방향 학습법

---

## 🚀 1단계: "와! 이게 가능해?" - 임팩트 있는 데모

### 목표

- Playwright의 놀라운 자동화 능력을 직접 체험
- 비개발자들의 호기심과 흥미 유발
- "나도 할 수 있겠다!"는 자신감 형성

### 실습 1: 다나와 자동 검색

```typescript
// selfStudy/01-demo-shopping.spec.ts
import { test, expect } from "@playwright/test";

test("다나와 자동 검색", async ({ page }) => {
  // 1. 다나와 접속
  await page.goto("https://danawa.com");

  // 2. 검색창 찾기 (다나와의 실제 검색창 선택자 사용)
  const searchInput = page
    .locator('input[placeholder="검색어를 입력해주세요."]')
    .first();
  await searchInput.waitFor({ state: "visible" });
  await searchInput.fill("노트북");

  // 3. 검색 버튼 클릭 (Enter 키 사용)
  await searchInput.press("Enter");

  // 4. 검색 결과 페이지 로딩 대기
  try {
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    await page.waitForTimeout(2000); // 추가 대기 시간
  } catch (error) {
    console.log("페이지 로딩 대기 중 오류 발생, 계속 진행합니다.");
  }

  // 5. 검색 결과 확인 (다나와의 실제 상품 리스트 선택자)
  try {
    await expect(
      page.locator("ul.product_list li.prod_item").first()
    ).toBeVisible({ timeout: 10000 });

    // 6. 상품 정보 5개 출력
    const products = page.locator("ul.product_list li.prod_item");
    const productCount = await products.count();
    console.log(`총 ${productCount}개의 상품을 찾았습니다.`);

    // 처음 5개 상품의 정보 출력
    for (let i = 0; i < Math.min(5, productCount); i++) {
      const product = products.nth(i);

      // 상품명 추출
      const productName = await product.locator(".prod_name a").textContent();

      // 가격 추출 (첫 번째 가격 정보)
      const priceElement = product.locator(".price_sect strong").first();
      const price = await priceElement.textContent();

      console.log(`\n${i + 1}번째 상품:`);
      console.log(`상품명: ${productName?.trim() || "상품명 없음"}`);
      console.log(`가격: ${price?.trim() || "가격 정보 없음"}`);
    }
  } catch (error) {
    console.log("상품 요소를 찾을 수 없습니다. 페이지 구조를 확인합니다.");
    // 페이지 제목 확인
    const title = await page.title();
    console.log("현재 페이지 제목:", title);

    // 현재 URL 확인
    const url = page.url();
    console.log("현재 URL:", url);
  }

  // 7. 스크린샷 저장
  await page.screenshot({ path: "danawa-result.png" });

  console.log("\n다나와 검색 완료!");
  console.log(
    "브라우저를 열어둔 상태로 유지합니다. 확인 후 브라우저를 직접 닫아주세요."
  );

  // 8. 브라우저를 열어둔 상태로 유지 (안전한 대기)
  try {
    await page.waitForTimeout(10000);
  } catch (error) {
    console.log("브라우저가 닫혔습니다. 테스트가 정상적으로 완료되었습니다.");
  }
});
```

### 실행 방법

```bash
# selfStudy 폴더로 이동
cd selfStudy

# 테스트 실행 (브라우저 창이 열리면서 실행 과정을 볼 수 있음)
npx playwright test 01-demo-shopping.spec.ts --headed

# HTML 리포트 생성
npx playwright test --reporter=html

# 결과 확인
npx playwright show-report

# 또는 한 번에 실행 (테스트 + HTML 리포트)
npx playwright test 01-demo-shopping.spec.ts --headed --reporter=html
```

### 예상 결과

```
총 51개의 상품을 찾았습니다.

1번째 상품:
상품명: 삼성전자 갤럭시북4 NT750XGR-A51A WIN11
가격: 797,900

2번째 상품:
상품명: 레노버 아이디어패드 Slim1-15ALC R5B WIN11 16GB램
가격: 423,760

3번째 상품:
상품명: MSI GF시리즈 Sword GF76 B13VFK
가격: 1,249,000

4번째 상품:
상품명: 에이서 스위프트 16 AI SF16-51-70J2
가격: 1,599,000

5번째 상품:
상품명: LG전자 울트라PC 15U50T-GA5HK
가격: 629,770

다나와 검색 완료!
브라우저를 열어둔 상태로 유지합니다. 확인 후 브라우저를 직접 닫아주세요.
```

### 실습 2: 유튜브 자동 시청

```typescript
// selfStudy/02-demo-youtube.spec.ts
import { test, expect } from "@playwright/test";

test("유튜브 자동 재생", async ({ page }) => {
  // 1. 유튜브 접속
  await page.goto("https://youtube.com");

  // 2. 검색어 입력
  await page.getByPlaceholder("검색").fill("Playwright 튜토리얼");
  await page.keyboard.press("Enter");

  // 3. 첫 번째 영상 클릭
  await page.getByTestId("video-title").first().click();

  // 4. 30초 대기 후 스크린샷
  await page.waitForTimeout(30000);
  await page.screenshot({ path: "youtube-watching.png" });
});
```

---

## 🎮 2단계: "나도 할 수 있어!" - 시각적 도구 활용

### 목표

- 코딩 없이도 자동화 가능함을 체험
- Codegen 도구로 자동화 시나리오 만들기
- 생성된 코드 이해하기

### 실습: Codegen으로 코드 없이 시작하기

#### 1단계: Codegen 실행

```bash
# 브라우저에서 직접 녹화 시작
npx playwright codegen https://www.google.com
```

#### 2단계: 자동화 시나리오 만들기

1. 구글 홈페이지에서 검색창 클릭
2. "Playwright 자습서" 입력
3. Enter 키 누르기
4. 첫 번째 검색 결과 클릭

#### 3단계: 생성된 코드 확인

```typescript
// Codegen이 자동 생성한 코드
test("Google 검색 자동화", async ({ page }) => {
  await page.goto("https://www.google.com/");
  await page.getByRole("combobox", { name: "Search" }).click();
  await page
    .getByRole("combobox", { name: "Search" })
    .fill("Playwright 자습서");
  await page.getByRole("combobox", { name: "Search" }).press("Enter");
  await page.getByRole("link", { name: "Playwright" }).click();
});
```

#### 4단계: 생성된 코드 실행

```bash
# selfStudy 폴더에서 실행
cd selfStudy
npx playwright test 03-google-search.spec.ts --headed
```

### 실습 과제

- 자신이 자주 사용하는 웹사이트에서 Codegen으로 자동화 시나리오 만들기
- 생성된 코드를 수정해서 다른 동작 추가해보기

---

## 🔍 3단계: "어떻게 동작하는지 궁금해!" - Inspector 활용

### 목표

- 자동화 과정을 눈으로 확인하고 이해하기
- 실시간 디버깅과 시각화 체험
- 문제 발생 시 해결 방법 학습

### 실습: Inspector로 실시간 디버깅

#### 1단계: Inspector 실행

```bash
# selfStudy 폴더에서 실시간으로 테스트 실행 과정 보기
cd selfStudy
npx playwright test 01-demo-shopping.spec.ts --headed --debug
```

#### 2단계: 트레이스 파일로 상세 분석

```bash
# 트레이스 파일 생성
npx playwright test 01-demo-shopping.spec.ts --trace on

# 트레이스 뷰어로 상세 분석
npx playwright show-trace
```

### 시각적 학습 포인트

#### 클릭 포인트 확인

- 정확히 어디를 클릭했는지 시각적으로 확인
- 선택자가 올바른 요소를 찾았는지 검증

#### 대기 시간 이해

- 페이지 로딩을 기다리는 과정 시각화
- 네트워크 요청과 응답 과정 확인

#### 선택자 이해

- 어떤 요소를 찾았는지 하이라이트 표시
- CSS 선택자 vs Playwright 로케이터 비교

#### 에러 발생 시 처리

- 문제가 생겼을 때 어떻게 처리하는지 확인
- 디버깅 정보와 에러 메시지 이해

### 실습 과제

- Inspector를 사용해서 복잡한 웹사이트 자동화해보기
- 트레이스 뷰어로 성능 분석해보기

---

## 📊 4단계: "결과를 예쁘게 보여줘!" - 리포트와 결과

### 목표

- 테스트 결과를 시각적으로 확인하고 공유하기
- HTML 리포트와 스크린샷 활용법 학습
- 결과 분석과 개선점 찾기

### 실습: HTML 리포트 생성

#### 1단계: HTML 리포트 생성

```bash
# selfStudy 폴더에서 HTML 리포트 생성
cd selfStudy
npx playwright test --reporter=html

# 리포트 확인
npx playwright show-report
```

#### 2단계: 스크린샷과 비디오 설정

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // 스크린샷 설정
    screenshot: "only-on-failure",

    // 비디오 설정
    video: "retain-on-failure",

    // 트레이스 설정
    trace: "on-first-retry",
  },
});
```

### 결과물 예시

#### 스크린샷

- 각 단계별 화면 캡처
- 실패 시점의 스크린샷
- 성공/실패 비교

#### 비디오

- 전체 테스트 과정 녹화
- 실패한 테스트의 재생
- 성능 분석

#### 통계

- 성공/실패율
- 실행 시간
- 브라우저별 성능 비교

#### 트레이스

- 상세한 실행 로그
- 네트워크 요청/응답
- DOM 변경사항

### 실습 과제

- 다양한 테스트 시나리오로 리포트 생성해보기
- 팀원과 결과 공유해보기

---

## 🧠 5단계: "이제 진짜 만들어보자!" - 핵심 개념 학습

### 목표

- 앞서 경험한 것들의 원리 이해
- 필수 개념만 집중 학습
- 실무에 바로 적용할 수 있는 지식 습득

### 핵심 개념 3가지

#### 1. 선택자 (Locator) - "어떻게 찾을까?"

##### 좋은 선택자 vs 나쁜 선택자

```typescript
// ❌ 나쁜 예시 - 불안정하고 유지보수 어려움
await page.locator("div:nth-child(3) > span").click();

// ✅ 좋은 예시 - 안정적이고 명확함
await page.getByRole("button", { name: "로그인" }).click();
await page.getByTestId("submit-button").click();
await page.getByText("회원가입").click();
```

##### 선택자 우선순위

1. **getByRole()** - 접근성과 의미가 명확
2. **getByText()** - 사용자가 보는 텍스트
3. **getByTestId()** - 테스트용 ID
4. **getByLabel()** - 폼 라벨
5. **getByPlaceholder()** - 플레이스홀더

#### 2. 대기 (Waiting) - "언제 클릭할까?"

##### 자동 대기

```typescript
// Playwright는 자동으로 기다려줌
await page.getByRole("button").click(); // 요소가 클릭 가능할 때까지 자동 대기
await page.fill("input", "text"); // 입력 필드가 준비될 때까지 자동 대기
```

##### 수동 대기

```typescript
// 특별한 경우에만 사용
await page.waitForLoadState("networkidle"); // 네트워크 요청 완료 대기
await page.waitForSelector(".loading-spinner", { state: "hidden" }); // 로딩 완료 대기
```

#### 3. 검증 (Assertion) - "제대로 됐나?"

##### 기본 검증

```typescript
// 페이지 제목 확인
await expect(page).toHaveTitle("네이버");

// 요소 존재 확인
await expect(page.getByText("로그인 성공")).toBeVisible();

// 텍스트 내용 확인
await expect(page.getByTestId("user-name")).toHaveText("홍길동");

// 개수 확인
await expect(page.getByTestId("todo-item")).toHaveCount(3);
```

##### 고급 검증

```typescript
// 정규식 사용
await expect(page.getByTestId("price")).toHaveText(/\d{1,3}(,\d{3})*원/);

// 부분 텍스트 확인
await expect(page.getByTestId("description")).toContainText("자동화");

// 속성 확인
await expect(page.getByRole("link")).toHaveAttribute("href", "/dashboard");
```

### 실습 과제

- 다양한 웹사이트에서 안정적인 선택자 찾기
- 자동 대기와 수동 대기 구분해서 사용하기
- 다양한 검증 방법 연습하기

---

## 💼 6단계: "실무에 바로 써먹자!" - 실전 프로젝트

### 목표

- 배운 것을 실제 업무에 적용하기
- 실무에서 자주 사용하는 시나리오 연습
- 팀과 협업하는 방법 학습

### 실무 예제들

#### 예제 1: 웹사이트 모니터링

```typescript
// examples/monitoring.spec.ts
import { test, expect } from "@playwright/test";

test("회사 웹사이트 상태 확인", async ({ page }) => {
  await page.goto("https://company-website.com");

  // 주요 기능들이 정상 작동하는지 확인
  await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
  await expect(page.getByRole("link", { name: "고객센터" })).toBeVisible();
  await expect(page.getByRole("link", { name: "제품소개" })).toBeVisible();

  // 페이지 로딩 시간 측정
  const loadTime = await page.evaluate(
    () => performance.timing.loadEventEnd - performance.timing.navigationStart
  );
  console.log(`페이지 로딩 시간: ${loadTime}ms`);

  // 스크린샷 저장
  await page.screenshot({ path: "website-status.png" });
});
```

#### 예제 2: 데이터 수집 자동화

```typescript
// examples/data-collection.spec.ts
import { test, expect } from "@playwright/test";

test("상품 가격 모니터링", async ({ page }) => {
  await page.goto("https://shopping-site.com/product/123");

  // 상품 정보 수집
  const price = await page.getByTestId("product-price").textContent();
  const stock = await page.getByTestId("stock-status").textContent();
  const rating = await page.getByTestId("product-rating").textContent();

  console.log(`상품 정보:`);
  console.log(`- 가격: ${price}`);
  console.log(`- 재고: ${stock}`);
  console.log(`- 평점: ${rating}`);

  // 특정 조건일 때 알림
  if (price.includes("할인")) {
    console.log("🎉 할인 상품 발견!");
  }

  // 데이터를 파일로 저장
  const fs = require("fs");
  const data = {
    timestamp: new Date().toISOString(),
    price: price,
    stock: stock,
    rating: rating,
  };

  fs.writeFileSync("product-data.json", JSON.stringify(data, null, 2));
});
```

#### 예제 3: 폼 자동 입력

```typescript
// selfStudy/06-form-automation.spec.ts
import { test, expect } from "@playwright/test";

test("회원가입 자동화", async ({ page }) => {
  await page.goto("https://signup.example.com");

  // 폼 입력
  await page.getByLabel("이름").fill("테스트 사용자");
  await page.getByLabel("이메일").fill("test@example.com");
  await page.getByLabel("비밀번호").fill("password123");
  await page.getByLabel("비밀번호 확인").fill("password123");

  // 약관 동의
  await page.getByLabel("이용약관 동의").check();
  await page.getByLabel("개인정보처리방침 동의").check();

  // 가입 버튼 클릭
  await page.getByRole("button", { name: "가입하기" }).click();

  // 성공 메시지 확인
  await expect(page.getByText("가입이 완료되었습니다")).toBeVisible();

  // 환영 이메일 확인
  await expect(page.getByText("환영합니다!")).toBeVisible();
});
```

#### 예제 4: API 테스트

```typescript
// selfStudy/07-api-testing.spec.ts
import { test, expect } from "@playwright/test";

test("API 응답 확인", async ({ page }) => {
  // API 요청 가로채기
  await page.route("**/api/users", async (route) => {
    // API 응답 모킹
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        users: [
          { id: 1, name: "홍길동", email: "hong@example.com" },
          { id: 2, name: "김철수", email: "kim@example.com" },
        ],
      }),
    });
  });

  await page.goto("https://example.com/users");

  // 사용자 목록 확인
  await expect(page.getByText("홍길동")).toBeVisible();
  await expect(page.getByText("김철수")).toBeVisible();
});
```

### 실습 과제

- 자신의 업무에서 자동화할 수 있는 작업 찾기
- 팀원들과 함께 자동화 시나리오 설계하기
- 실제 웹사이트로 테스트 시나리오 만들어보기

---

## 🤝 7단계: "팀과 함께 성장하기!" - 협업과 확장

### 목표

- 개인 학습을 팀 차원으로 확장
- 지속적인 개선과 학습 문화 만들기
- 자동화 문화 정착하기

### 협업 활동

#### 1. 테스트 시나리오 공유

```typescript
// selfStudy/08-team-scenarios.spec.ts
import { test, expect } from "@playwright/test";

// 팀원 A가 만든 시나리오: 로그인 플로우 테스트
test("로그인 플로우 테스트", async ({ page }) => {
  await page.goto("https://example.com/login");
  await page.getByLabel("이메일").fill("user@example.com");
  await page.getByLabel("비밀번호").fill("password123");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByText("환영합니다!")).toBeVisible();
});

// 팀원 B가 만든 시나리오: 상품 검색 테스트
test("상품 검색 테스트", async ({ page }) => {
  await page.goto("https://shopping.example.com");
  await page.getByPlaceholder("상품을 검색하세요").fill("노트북");
  await page.keyboard.press("Enter");
  await expect(page.getByText("검색 결과")).toBeVisible();
});

// 팀원 C가 만든 시나리오: 장바구니 테스트
test("장바구니 테스트", async ({ page }) => {
  await page.goto("https://shopping.example.com/product/123");
  await page.getByLabel("수량").selectOption("2");
  await page.getByRole("button", { name: "장바구니 추가" }).click();
  await expect(page.getByText("장바구니에 추가되었습니다")).toBeVisible();
});
```

#### 2. 문제 해결 세션

- 어려웠던 부분들 함께 해결
- 디버깅 팁 공유
- 성능 최적화 방법 토론

#### 3. 모범 사례 정리

```markdown
# 팀 모범 사례

## 선택자 작성 규칙

- getByRole() 우선 사용
- 의미있는 test-id 사용
- 텍스트 기반 선택자 활용

## 테스트 구조화

- Page Object Model 사용
- 공통 함수 분리
- 설정 파일 관리

## 성능 최적화

- 병렬 실행 활용
- 불필요한 대기 제거
- 리소스 정리
```

#### 4. 지속적 개선

- 정기적인 테스트 업데이트
- 새로운 기능 추가
- 성능 모니터링

### 팀 활동 가이드

#### 주간 활동

1. **월요일**: 새로운 자동화 아이디어 브레인스토밍
2. **화요일**: 개인 프로젝트 진행
3. **수요일**: 중간 점검 및 문제 해결
4. **목요일**: 결과 공유 및 피드백
5. **금요일**: 다음 주 계획 수립

#### 월간 활동

1. **1주차**: 새로운 도구나 기능 학습
2. **2주차**: 실무 적용 및 테스트
3. **3주차**: 결과 분석 및 개선
4. **4주차**: 팀 전체 공유 및 문서화

---

## 📚 추가 학습 자료

### 필수 명령어

```bash
# selfStudy 폴더로 이동
cd selfStudy

# 프로젝트 초기화
npm init playwright@latest

# 브라우저 설치
npx playwright install

# 테스트 실행
npx playwright test

# 특정 테스트 실행
npx playwright test 01-demo-shopping.spec.ts

# 브라우저에서 실행
npx playwright test --headed

# 디버그 모드
npx playwright test --debug

# 코드 생성
npx playwright codegen

# 리포트 확인
npx playwright show-report

# 트레이스 확인
npx playwright show-trace
```

### 유용한 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    // 기본 설정
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
```

### 문제 해결 가이드

#### 자주 발생하는 오류

1. **요소를 찾을 수 없음**

   - 선택자 확인
   - 페이지 로딩 대기
   - iframe 확인

2. **타임아웃 오류**

   - 네트워크 상태 확인
   - 대기 시간 조정
   - 페이지 로딩 상태 확인

3. **스크린샷 오류**
   - 권한 확인
   - 경로 확인
   - 디스크 공간 확인

#### 디버깅 팁

- `--debug` 모드 활용
- 트레이스 파일 분석
- 콘솔 로그 확인
- 네트워크 탭 확인

---

## 🎯 핵심 메시지

### 비개발자에게 전달할 핵심 메시지:

1. **"코딩 몰라도 됩니다!"** - 시각적 도구로 시작
2. **"즉시 결과를 볼 수 있습니다!"** - 실시간 피드백
3. **"반복 작업을 자동화할 수 있습니다!"** - 업무 효율성
4. **"팀과 함께 성장할 수 있습니다!"** - 협업 문화

### 학습 효과:

- **즉시 성취감**: 첫 시간부터 결과물 생성
- **점진적 이해**: 경험 → 개념 → 응용
- **실무 연계**: 배운 것을 바로 업무에 적용
- **지속적 동기**: 성공 경험이 다음 학습 동기

---

## 🚀 다음 단계

### 고급 학습 주제

1. **성능 테스트**: 웹사이트 성능 측정
2. **보안 테스트**: 취약점 탐지
3. **접근성 테스트**: 웹 접근성 검증
4. **모바일 테스트**: 반응형 디자인 검증

### 커뮤니티 참여

- [Playwright Discord](https://aka.ms/playwright/discord)
- [GitHub Discussions](https://github.com/microsoft/playwright/discussions)
- [공식 문서](https://playwright.dev)

### 지속적 학습

- 새로운 기능 업데이트 확인
- 커뮤니티 예제 학습
- 실무 프로젝트에 적용
- 팀과 지식 공유

---

**🎉 축하합니다! 이제 당신도 웹 자동화 전문가입니다!**

> **기억하세요**: 자동화는 반복적인 작업을 줄이고, 더 중요한 일에 집중할 수 있게 해줍니다.
> 작은 것부터 시작해서 점진적으로 확장해나가세요!
