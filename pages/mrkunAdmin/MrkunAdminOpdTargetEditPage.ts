/**
 * ページオブジェクト（OPD管理画面 - 対象医師編集）
 */
import { type Page } from '@playwright/test';
import { MrkunAdminOpdCommonComponent } from './common/MrkunAdminOpdCommonComponent';

export class AdminOpdTargetEditPage {
  readonly page: Page;
  readonly common: MrkunAdminOpdCommonComponent;

  constructor(page: Page) {
    this.page = page;
    this.common = new MrkunAdminOpdCommonComponent(page);
  }

  /**
   * 対象医師編集画面に遷移する
   * @param opdId - OPD ID
   */
  async navigateToTargetEditPage(opdId: string): Promise<void> {
    await this.page.goto(`https://mrkun.m3.com/admin/restricted/mt/OnePointDetail/targetEdit.jsp?id=${opdId}`);
  }

  /**
   * システムコードを入力する
   * @param systemCode - 医師のシステムコード
   */
  async fillSystemCode(systemCode: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'ID システムコード' }).fill(systemCode);
  }

  /**
   * 追加ボタンをクリックする
   */
  async clickAddButton(): Promise<void> {
    await this.page.getByRole('button', { name: '追加' }).click();
  }

  /**
   * 警告チェックボックスをチェックする
   */
  async checkWarning(): Promise<void> {
    await this.page.locator('#warning').check();
  }

  /**
   * 実行ボタンをクリックする
   */
  async clickExecuteButton(): Promise<void> {
    await this.page.getByRole('button', { name: '実 行' }).click();
  }

  /**
   * 対象医師を追加する（一連の処理）
   * @param systemCode - 医師のシステムコード
   */
  async addTargetDoctor(systemCode: string): Promise<void> {
    await this.fillSystemCode(systemCode);
    await this.clickAddButton();
    await this.checkWarning();
    await this.clickExecuteButton();
  }
}
