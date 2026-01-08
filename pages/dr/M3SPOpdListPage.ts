import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * M3.com SP版 OPD一覧ページ
 * 医師向けのワンポイント医療情報一覧画面（スマートフォン版）
 */
export class M3SPOpdListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * OPD一覧ページに遷移
   */
  async goto() {
    await this.page.goto('https://mrkun.m3.com/mt/onepoint/top.htm?tc=sub-m3com');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  /**
   * 指定されたタイトルのOPDが一覧に表示されているか確認
   * @param title OPDのタイトル
   * @returns タイトルが見つかった場合true
   */
  async hasOpdWithTitle(title: string): Promise<boolean> {
    try {
      const titleLocator = this.page.locator('tbody > tr > td:nth-child(1) > a', { hasText: title });
      return await titleLocator.isVisible({ timeout: 10000 });
    } catch {
      return false;
    }
  }

  /**
   * 指定されたタイトルのOPDが一覧の最初に表示されていることを確認
   * @param title OPDのタイトル
   */
  async verifyFirstOpdTitle(title: string) {
    const firstTitleLink = this.page.locator('tbody > tr > td:nth-child(1) > a').first();
    await expect(firstTitleLink).toHaveText(title);
    console.log(`✓ OPD一覧の最初のタイトルが「${title}」であることを確認しました`);
  }

  /**
   * 指定されたタイトルのOPDをクリック
   * @param title OPDのタイトル
   */
  async clickOpdByTitle(title: string) {
    const opdLink = this.page.locator('tbody > tr > td:nth-child(1) > a', { hasText: title });
    await opdLink.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
  }
}
