/**
 * ページオブジェクト（医師画面 - OPD表示）
 */
import { type Page, expect, type FrameLocator, Locator } from '@playwright/test';

export class DrOpdViewPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * OPD表示画面に遷移する
   * @param opdId - OPD ID
   */
  async navigateToOpdView(opdId: string): Promise<void> {
    await this.page.goto(`https://mrkun.m3.com/mt/onepoint/${opdId}/view.htm?pageContext=opd1.0&sort=unread&mkep=list`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * タイトルの要素を取得する
   * @param title - 確認するタイトル
   */
  async getDispTitle(title: string): Promise<Locator> {
    return await this.page.getByRole('term').filter({ hasText: title });
  }

  /**
   * 表示されている日付の要素を取得する
   * @param date - 確認する日付
   */
  async getDispDate(date: string): Promise<Locator> {
    return await this.page.getByText(date);
  }

  /**
   * 表示されている会社名の要素を取得する
   * @param companyName - 確認する会社名
   */
  async getCompanyName(companyName: string): Promise<Locator> {
    return await this.page.getByText(companyName).first();
  }

  /**
   * iframe内のコンテンツを取得する
   * @returns iframe locator
   */
  getIframe(): FrameLocator {
    return this.page.frameLocator('#iframeMessage');
  }

  /**
   * iframe内のすべてのリンク数を取得する
   * @returns リンク数
   */
  async getIframeLinkCount(): Promise<number> {
    const iframe = this.getIframe();
    const linksInIframe = iframe.locator('a');
    return await linksInIframe.count();
  }
}
