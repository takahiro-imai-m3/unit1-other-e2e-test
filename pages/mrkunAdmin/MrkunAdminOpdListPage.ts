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

  /**
   * OPD IDで絞り込んだOPD編集画面に遷移する
   * @param opdId - OPD ID
   */
  async gotoOpdDetailByOpdId(opdId: string): Promise<void> {
    const url = `https://mrkun.m3.com/admin/restricted/mt/OnePointDetail/list.jsp?pointCompanyCd=&productName=&memo=&opdId=${opdId}&action=view`;
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
    console.log(`⏳ OPD管理画面に遷移: ${opdId}`);
  }

  /**
   * 開封数を取得する
   * @returns 開封数（total: 総開封数, charged: うち課金）
   */
  async getOpenedCount(): Promise<{ total: number; charged: number }> {
    // XPath: //*[@id="widthpx"]/table[2]/tbody/tr/td[8]/span[1] - 総開封数
    const totalSpan = this.page.locator('xpath=//*[@id="widthpx"]/table[2]/tbody/tr/td[8]/span[1]');
    const totalText = await totalSpan.innerText();
    const total = parseInt(totalText, 10);

    // XPath: //*[@id="widthpx"]/table[2]/tbody/tr/td[8]/span[2] - (うち課金N)
    const chargedSpan = this.page.locator('xpath=//*[@id="widthpx"]/table[2]/tbody/tr/td[8]/span[2]');
    const chargedText = await chargedSpan.innerText();
    // "(うち課金N)" から数値を抽出
    const chargedMatch = chargedText.match(/\d+/);
    const charged = chargedMatch ? parseInt(chargedMatch[0], 10) : 0;

    console.log(`📊 開封数: ${total} (うち課金${charged})`);
    return { total, charged };
  }

}
