import { Page } from '@playwright/test';

/**
 * 共通のPage Objectベースクラス
 * すべてのページクラスはこのクラスを継承する
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * 指定したURLに移動
   */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /**
   * ページタイトルを取得
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * 要素が表示されるまで待機
   */
  async waitForElement(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * スクリーンショットを撮影
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }
}
