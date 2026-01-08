/**
 * 医師画面共通コンポーネント
 */
import { type Page } from '@playwright/test';

export class DrCommonComponent {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * ログインページにアクセスします（ログアウトしてから）
   */
  async navigateToDrLogin() {
    await this.page.goto('https://www.m3.com/logout');
    await this.page.goto('https://www.m3.com');
  }
}
