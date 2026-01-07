import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * Googleログインページ
 * Google OAuth認証を処理
 */
export class GoogleLoginPage extends BasePage {
  // ロケーター定義
  readonly emailInput: Locator;
  readonly nextButton: Locator;
  readonly passwordInput: Locator;
  readonly passwordNextButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Email入力フォームの要素
    this.emailInput = page.locator('input[type="email"]');
    this.nextButton = page.locator('button:has-text("Next"), button:has-text("次へ")');

    // Password入力フォームの要素
    this.passwordInput = page.locator('input[type="password"]').first();
    this.passwordNextButton = page.locator('button:has-text("Next"), button:has-text("次へ")');

    // エラーメッセージ
    this.errorMessage = page.locator('[role="alert"], .error-message');
  }

  /**
   * Googleアカウントでログイン
   * @param email メールアドレス
   * @param password パスワード
   */
  async login(email: string, password: string) {
    // メールアドレス入力
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.emailInput.fill(email);
    await this.nextButton.click();

    // パスワード入力画面の表示を待つ
    await this.passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.passwordInput.fill(password);
    await this.passwordNextButton.click();
  }

  /**
   * Googleログインページが表示されているか確認
   */
  async isGoogleLoginPage(): Promise<boolean> {
    return await this.page.url().includes('accounts.google.com');
  }

  /**
   * ログインエラーを確認
   * @param expectedMessage 期待するエラーメッセージ（オプション）
   */
  async expectLoginError(expectedMessage?: string) {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
  }
}
