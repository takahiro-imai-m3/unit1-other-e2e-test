/**
 * OPD管理画面(OPEx)の共通パーツ
 */
import { type Page } from '@playwright/test';

export class OpexOpdCommonComponent {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * OPD画面にログイン
   */
  async OpexLogin(): Promise<void> {
    const url='https://opex.m3internal.com/internal/dashboard'
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    
    // QAユーザーでログイン済みかどうかをチェック
    let isQAUser = await this.page.getByText('U1_QA_test001').isVisible().catch(() => false);

    if (isQAUser) {
      console.log('OPD管理画面が表示されました。');
    } else {
      console.log('ログイン画面が表示されているため、ログイン処理を行います。');
      await this.page.getByRole('textbox', { name: 'Username' }).fill('U1_QA_test001');
      await this.page.getByRole('textbox', { name: 'Password' }).fill('#Test1234');
      await this.page.getByRole('button', { name: 'submit' }).click();
      await this.page.goto(url);
      isQAUser = await this.page.getByText('U1_QA_test001').isVisible().catch(() => false);
      if (!isQAUser) {
        throw new Error('QA環境のOPD管理画面が表示されていません。');
      }
    }
    await this.page.waitForURL(url);
  }
}
