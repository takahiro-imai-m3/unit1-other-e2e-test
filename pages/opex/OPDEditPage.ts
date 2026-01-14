import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * OPD編集ページ
 * 既存のOPDメッセージを編集するためのPage Object
 */
export class OPDEditPage extends BasePage {
  // フォーム要素
  readonly pcDetailBodyInput: Locator;
  readonly managementMemoInput: Locator;
  readonly deliveryStatusStoppedRadio: Locator;
  readonly openingLimitInput: Locator;

  // ボタン
  readonly copyPcToSpButton: Locator;
  readonly updateButton: Locator;
  readonly confirmOkButton: Locator;

  constructor(page: Page) {
    super(page);

    // PCディテール本文入力フィールド
    this.pcDetailBodyInput = page.getByRole('textbox', { name: 'PCディテール本文' });

    // 管理メモ
    this.managementMemoInput = page.getByRole('textbox', { name: '管理メモ' });

    // 配信ステータス（停止）
    this.deliveryStatusStoppedRadio = page.locator('span.el-radio__inner').first();

    // 開封上限
    this.openingLimitInput = page.locator('#openUserCountLimit').getByRole('spinbutton');

    // ボタン
    this.copyPcToSpButton = page.getByRole('button', { name: 'PCディテール本文をSPディテール本文にコピーする' });
    this.updateButton = page.getByRole('button', { name: '更新' });
    this.confirmOkButton = page.getByRole('button', { name: 'OK' });
  }

  /**
   * OPD編集画面に遷移
   * @param opdId OPD ID
   * @param proxyNumber プロキシ番号（例: "-qa1"）
   * @param fromMrkunView MR君ビューから遷移する場合はtrue（デフォルト: true）
   */
  async goto(opdId: string, proxyNumber: string = '-qa1', fromMrkunView: boolean = true) {
    const fromParam = fromMrkunView ? '?from_mrkun_view=true' : '';
    await this.page.goto(`https://opex${proxyNumber}.unit1.qa-a.m3internal.com/internal/mrf_management/opd/edit/${opdId}${fromParam}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * ページがロードされるまで待機
   */
  async waitForPageLoad() {
    await this.page.waitForTimeout(5000);
    // PCディテール本文フィールドが表示されるまで待機
    await this.pcDetailBodyInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * PCディテール本文のみを更新（SPにはコピーしない）
   * @param content 新しい本文内容
   */
  async updatePcDetailBody(content: string) {
    // 既存の内容をクリア
    await this.pcDetailBodyInput.clear();

    // 新しい内容を入力
    await this.pcDetailBodyInput.fill(content);

    // 入力完了を待つ
    await this.page.waitForTimeout(500);
  }

  /**
   * PCディテール本文を更新してSPにコピー
   * @param content 新しい本文内容
   */
  async updatePcDetailBodyAndCopy(content: string) {
    // PCディテール本文を更新
    await this.updatePcDetailBody(content);

    // SPにコピー（確認ダイアログが表示される）
    await this.copyPcToSpButton.click();

    // 確認ダイアログの表示を待つ
    await this.page.waitForTimeout(500);

    // 確認ダイアログのOKボタンをクリック
    await this.confirmOkButton.click();

    // コピー処理の完了を待つ
    await this.page.waitForTimeout(1000);
  }

  /**
   * 更新を実行
   */
  async clickUpdate() {
    // 更新ボタンをクリック（確認ダイアログが表示される）
    await this.updateButton.click();

    // 確認ダイアログの表示を待つ
    await this.page.waitForTimeout(500);

    // 確認ダイアログのOKボタンをクリック
    await this.confirmOkButton.click();

    // 更新完了を待つ
    await this.page.waitForTimeout(3000);
  }

  /**
   * OPDメッセージを更新（すべてのステップを実行）
   * @param opdId OPD ID
   * @param newContent 新しいPCディテール本文の内容
   * @param proxyNumber プロキシ番号（例: "-qa1"）
   */
  async updateOPDMessage(opdId: string, newContent: string, proxyNumber: string = '-qa1'): Promise<void> {
    // 編集ページに遷移
    await this.goto(opdId, proxyNumber);

    // ページロード待機
    await this.waitForPageLoad();

    // PCディテール本文を更新してSPにコピー
    await this.updatePcDetailBodyAndCopy(newContent);

    // 更新実行
    await this.clickUpdate();
  }

  /**
   * 配信ステータスを停止に設定して管理メモをクリア
   * @param opdId OPD ID
   * @param proxyNumber プロキシ番号（例: "-qa1"）
   */
  async stopDelivery(opdId: string, proxyNumber: string = '-qa1'): Promise<void> {
    // 編集ページに遷移
    await this.goto(opdId, proxyNumber, true);

    // ページロード待機
    await this.waitForPageLoad();

    // 配信ステータスを停止に変更
    await this.deliveryStatusStoppedRadio.click();
    await this.page.waitForTimeout(500);

    // 管理メモをクリア
    await this.managementMemoInput.clear();
    await this.page.waitForTimeout(500);

    // 更新実行
    await this.clickUpdate();

    console.log(`✓ OPD ${opdId} の配信を停止しました`);
  }

  /**
   * 開封上限を更新
   * @param opdId OPD ID
   * @param openingLimit 新しい開封上限値（空文字列で削除）
   * @param proxyNumber プロキシ番号（例: "-qa1"）
   */
  async updateOpeningLimit(opdId: string, openingLimit: string, proxyNumber: string = '-qa1'): Promise<void> {
    // 編集ページに遷移
    await this.goto(opdId, proxyNumber, true);

    // ページロード待機
    await this.waitForPageLoad();

    // 開封上限をクリアして新しい値を設定
    await this.openingLimitInput.clear();
    await this.page.waitForTimeout(500);

    if (openingLimit !== '') {
      await this.openingLimitInput.fill(openingLimit);
      await this.page.waitForTimeout(500);
    }

    // 更新実行
    await this.clickUpdate();

    const limitText = openingLimit === '' ? '削除' : openingLimit;
    console.log(`✓ OPD ${opdId} の開封上限を「${limitText}」に更新しました`);
  }
}
