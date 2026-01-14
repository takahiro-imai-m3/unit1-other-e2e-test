/**
 * MR君管理画面の共通パーツ
 */
import { type Page } from '@playwright/test';

export class MrkunAdminOpdCommonComponent {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * MR君管理画面にログイン
   */
  async MrkunLogin(): Promise<void> {
    const url = 'https://mrkun.m3.com/admin/';
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    console.log('MR君管理画面が表示されました。');
  }
}
