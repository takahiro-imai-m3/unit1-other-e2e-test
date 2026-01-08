import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * OPDコピーページ
 * 既存のOPDメッセージをコピーするためのPage Object
 */
export class OPDCopyPage extends BasePage {
  // ボタン
  readonly copyButton: Locator;
  readonly confirmOkButton: Locator;
  readonly idInput: Locator;

  constructor(page: Page) {
    super(page);

    // ボタン
    this.copyButton = page.getByRole('button', { name: 'コピー作成' });
    this.confirmOkButton = page.getByRole('button', { name: 'OK' });
    // ID入力フィールド（id="id"属性を持つinput要素）
    this.idInput = page.locator('input#id');
  }

  /**
   * OPDコピー画面に遷移
   * @param opdId コピー元のOPD ID
   * @param proxyNumber プロキシ番号（例: "-qa1"）
   */
  async goto(opdId: string, proxyNumber: string = '-qa1') {
    await this.page.goto(`https://opex${proxyNumber}.unit1.qa-a.m3internal.com/internal/mrf_management/opd/copy/${opdId}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * ページがロードされるまで待機
   */
  async waitForPageLoad() {
    await this.page.waitForTimeout(3000);
    // コピー作成ボタンが表示されるまで待機
    await this.copyButton.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * コピー作成を実行
   * @returns 作成されたOPDのID
   */
  async clickCopyCreate(): Promise<string> {
    // コピー作成ボタンをクリック（確認ダイアログが表示される）
    await this.copyButton.click();

    // 確認ダイアログの表示を待つ
    await this.page.waitForTimeout(1000);

    // 確認ダイアログのOKボタンをクリック
    await this.confirmOkButton.click();

    // コピー作成完了を待つ
    await this.page.waitForTimeout(10000);

    // 作成されたOPD IDを取得
    const opdId = await this.idInput.inputValue();
    return opdId;
  }

  /**
   * OPDをコピー作成（すべてのステップを実行）
   * @param sourceOpdId コピー元のOPD ID
   * @param proxyNumber プロキシ番号（例: "-qa1"）
   * @returns 作成されたOPDのID
   */
  async copyOPD(sourceOpdId: string, proxyNumber: string = '-qa1'): Promise<string> {
    // コピーページに遷移
    await this.goto(sourceOpdId, proxyNumber);

    // ページロード待機
    await this.waitForPageLoad();

    // コピー作成実行
    const newOpdId = await this.clickCopyCreate();

    console.log(`✓ OPDコピー作成完了: ${sourceOpdId} → ${newOpdId}`);

    return newOpdId;
  }
}
