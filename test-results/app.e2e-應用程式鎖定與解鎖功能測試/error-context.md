# Test info

- Name: 應用程式鎖定與解鎖功能測試
- Location: C:\Users\Dell\Desktop\wk\apivue\vue\test\app.e2e.spec.js:3:1

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('input[placeholder="請輸入密碼"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('input[placeholder="請輸入密碼"]')

    at C:\Users\Dell\Desktop\wk\apivue\vue\test\app.e2e.spec.js:17:31
```

# Page snapshot

```yaml
- heading "頁面已鎖定" [level=2]
- textbox "輸入密碼解鎖(1234)"
- button "解鎖"
```

# Test source

```ts
   1 | const { test, expect } = require("@playwright/test");
   2 |
   3 | test("應用程式鎖定與解鎖功能測試", async ({ page, context }) => {
   4 |   // 設定 localStorage 使應用程式初始時被鎖定
   5 |   await context.addInitScript(() => {
   6 |     localStorage.setItem("appLockedState", "true");
   7 |   });
   8 |
   9 |   await page.goto("http://localhost:8080");
  10 |
  11 |   // 驗證鎖定畫面是否可見
  12 |   const lockScreen = page.locator(".lock-screen");
  13 |   await expect(lockScreen).toBeVisible();
  14 |
  15 |   // 假設密碼輸入框的 placeholder 為 "請輸入密碼"
  16 |   const passwordInput = page.locator('input[placeholder="請輸入密碼"]');
> 17 |   await expect(passwordInput).toBeVisible();
     |                               ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  18 |
  19 |   // 假設解鎖按鈕的文字為 "解鎖"
  20 |   const unlockButton = page.locator('button:has-text("解鎖")');
  21 |   await expect(unlockButton).toBeVisible();
  22 |
  23 |   // 嘗試使用錯誤的密碼解鎖
  24 |   await passwordInput.fill("wrongpassword");
  25 |   await unlockButton.click();
  26 |
  27 |   // 驗證錯誤訊息是否顯示，且鎖定畫面仍然可見
  28 |   // 假設錯誤訊息的文字為 "密碼錯誤"
  29 |   const errorMessage = page.locator("text=密碼錯誤");
  30 |   await expect(errorMessage).toBeVisible();
  31 |   await expect(lockScreen).toBeVisible();
  32 |
  33 |   // 嘗試使用正確的密碼解鎖 (App.vue 中設定的 CORRECT_PASSWORD 為 "1234")
  34 |   await passwordInput.fill("1234");
  35 |   await unlockButton.click();
  36 |
  37 |   // 驗證鎖定畫面是否已消失，且錯誤訊息也消失
  38 |   await expect(lockScreen).not.toBeVisible();
  39 |   await expect(errorMessage).not.toBeVisible();
  40 |
  41 |   // 可選：驗證主應用程式內容現在是否可見
  42 |   // 例如，如果 App.vue 的主內容中有 'nav' 元素：
  43 |   // await expect(page.locator('nav')).toBeVisible();
  44 | });
  45 |
```