const { test, expect } = require("@playwright/test");

test("應用程式鎖定與解鎖功能測試", async ({ page, context }) => {
  // 設定 localStorage 使應用程式初始時被鎖定
  await context.addInitScript(() => {
    localStorage.setItem("appLockedState", "true");
  });

  await page.goto("http://localhost:8080");

  // 驗證鎖定畫面是否可見
  const lockScreen = page.locator(".lock-screen");
  await expect(lockScreen).toBeVisible();

  // 假設密碼輸入框的 placeholder 為 "請輸入密碼"
  const passwordInput = page.locator('input[placeholder="請輸入密碼"]');
  await expect(passwordInput).toBeVisible();

  // 假設解鎖按鈕的文字為 "解鎖"
  const unlockButton = page.locator('button:has-text("解鎖")');
  await expect(unlockButton).toBeVisible();

  // 嘗試使用錯誤的密碼解鎖
  await passwordInput.fill("wrongpassword");
  await unlockButton.click();

  // 驗證錯誤訊息是否顯示，且鎖定畫面仍然可見
  // 假設錯誤訊息的文字為 "密碼錯誤"
  const errorMessage = page.locator("text=密碼錯誤");
  await expect(errorMessage).toBeVisible();
  await expect(lockScreen).toBeVisible();

  // 嘗試使用正確的密碼解鎖 (App.vue 中設定的 CORRECT_PASSWORD 為 "1234")
  await passwordInput.fill("1234");
  await unlockButton.click();

  // 驗證鎖定畫面是否已消失，且錯誤訊息也消失
  await expect(lockScreen).not.toBeVisible();
  await expect(errorMessage).not.toBeVisible();

  // 可選：驗證主應用程式內容現在是否可見
  // 例如，如果 App.vue 的主內容中有 'nav' 元素：
  // await expect(page.locator('nav')).toBeVisible();
});
