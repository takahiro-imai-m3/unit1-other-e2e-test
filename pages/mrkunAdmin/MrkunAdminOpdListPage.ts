/**
 * ページオブジェクト（OPD管理画面 - コピー作成）
 */
import { Locator, type Page } from '@playwright/test';
import { MrkunAdminOpdCommonComponent } from './common/MrkunAdminOpdCommonComponent';

export class MrkunAdminOpdListPage {
  readonly page: Page;
  readonly common: MrkunAdminOpdCommonComponent;
  readonly editLink_first:Locator;
  readonly copyLink_first:Locator;

  constructor(page: Page) {
    this.page = page;
    this.common = new MrkunAdminOpdCommonComponent(page);
    this.editLink_first=this.page.getByRole('link', { name: '編集' }).first();
    this.copyLink_first=this.page.getByRole('link', { name: '画面コピー' }).first();
  }

  /**
   * 編集画面に遷移する
   * @param opdId - 編集をしたいOPDのID
   */
  async navigateToEditPage(opdId: string): Promise<void> {
    await this.editLink_first.click();
  }

  /**
   * コピー作成画面に遷移する
   * @param opdId - コピー元のOPD ID
   */
  async navigateToCopyPage(opdId: string): Promise<void> {
    await this.copyLink_first.click();
  }

  /**
   * 対象医師編集画面に遷移する
   * @param opdId - OPD ID
   */
  async navigateToTargetEditPage(opdId: string): Promise<void> {
    await this.page.goto(`https://mrkun.m3.com/admin/restricted/mt/OnePointDetail/targetEdit.jsp?id=${opdId}`);
  }

}
