/**
 * m3.com TOP画面
 */
import { type Page} from '@playwright/test';

export class DrTopPage {
  readonly page: Page;
  //readonly common: MrCommonComponent; ←各ページのCommonComponentを定義

  /**
   * DrTopPageのインスタンスを初期化
   * @param page - PlaywrightのPageオブジェクト
   */
  constructor(page: Page) {
    this.page = page;
    //this.common = new MrCommonComponent(page); ←各ページのCommonComponentのインスタンスをcommonに保存
  }
}
