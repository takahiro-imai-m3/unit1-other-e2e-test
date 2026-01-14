import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * M3.com PC版 ログインページ
 * PC版M3.comへのログイン機能を提供
 */
export class M3PCLoginPage extends BasePage {
  // ログインフォーム
  readonly loginIdInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);

    // ログインフォーム要素
    this.loginIdInput = page.locator('#loginId');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.getByRole('button', { name: 'ログイン' });
  }

  /**
   * PC版M3.comに遷移
   */
  async goto() {
    await this.page.goto('https://www.m3.com/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  /**
   * PC版M3.comにログイン
   * @param loginId ログインID
   * @param password パスワード
   */
  async login(loginId: string, password: string) {
    console.log(`⏳ M3.com PC版にログイン: ${loginId}`);
    await this.loginIdInput.fill(loginId);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('domcontentloaded');
    console.log(`✓ M3.com PC版ログイン完了`);
  }

  /**
   * M3.comログイン（goto含む）
   * @param loginId ログインID
   * @param password パスワード
   */
  async loginToM3(loginId: string, password: string) {
    await this.goto();
    await this.login(loginId, password);
  }
}
