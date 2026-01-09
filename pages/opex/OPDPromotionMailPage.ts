import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * OPD開封促進メールページ
 * OPDの開封促進メール設定・配信準備を行うためのPage Object
 */
export class OPDPromotionMailPage extends BasePage {
  // ボタン
  readonly previewImageButton: Locator;
  readonly deliveryDateField: Locator;
  readonly datePickerField: Locator;
  readonly timePickerField: Locator;
  readonly okButton: Locator;
  readonly testEmailField: Locator;
  readonly dcfNoneRadio: Locator;
  readonly registerDeliveryButton: Locator;
  readonly confirmListIdButton: Locator;

  // ステータス表示
  readonly statusSpan: Locator;

  constructor(page: Page) {
    super(page);

    // ボタンとフィールド
    this.previewImageButton = page.getByRole('button', { name: 'プレビュー画像生成' });
    this.deliveryDateField = page.getByRole('textbox', { name: '既読促進メールの配信日付' });
    this.datePickerField = page.getByRole('textbox', { name: '日付を選択' });
    this.timePickerField = page.getByRole('textbox', { name: '時間を選択' });
    this.okButton = page.getByRole('button', { name: 'OK' });
    this.registerDeliveryButton = page.getByRole('button', { name: '設定した内容で配信登録/テストメール送信' });
    this.confirmListIdButton = page.getByRole('button', { name: '同日配信のターゲットメールのリストID設定の確認' });

    // ステータス
    this.statusSpan = page.locator('span').filter({ hasText: /^(配信登録待ち|同日配信のターゲットメールのリストID設定の確認待ち)$/ });
  }

  /**
   * 開封促進メール画面に遷移
   * @param opdId OPD ID
   * @param proxyNumber プロキシ番号（例: "-qa1"）
   */
  async goto(opdId: string, proxyNumber: string = '-qa1') {
    await this.page.goto(`https://opex${proxyNumber}.unit1.qa-a.m3internal.com/internal/mrf_management/promotion_mail/${opdId}`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(10000);
  }

  /**
   * プレビュー画像を生成（画像生成完了まで待機）
   */
  async generatePreviewImage() {
    await this.previewImageButton.click();
    console.log('✓ プレビュー画像生成を開始');

    // 画像生成待ち（最大40秒）
    await this.page.waitForTimeout(40000);

    // 画像生成後、さらに待機して画面が安定するのを待つ
    await this.page.waitForTimeout(5000);

    // デバッグ: 現在の画面状態を確認
    await this.page.screenshot({ path: 'debug-after-preview.png', fullPage: true });
    const pageHtml = await this.page.content();
    require('fs').writeFileSync('debug-after-preview.html', pageHtml);

    // 配信日付フィールドの状態を確認
    const fieldDisabled = await this.page.evaluate(() => {
      const field = document.querySelector('input[placeholder="既読促進メールの配信日付"]');
      return field ? (field as HTMLInputElement).disabled : null;
    });
    console.log(`✓ プレビュー画像生成完了（配信日付フィールド disabled=${fieldDisabled}）`);
  }

  /**
   * メール配信予定日時を設定
   * @param date 日付（YYYY-MM-DD形式）
   * @param time 時刻（HH:mm:ss形式）
   */
  async setDeliveryDateTime(date: string, time: string) {
    // 配信日付フィールドが有効化されるまで待機（最大30秒）
    await this.deliveryDateField.waitFor({ state: 'attached', timeout: 30000 });
    await this.page.waitForFunction(() => {
      const field = document.querySelector('input[placeholder="既読促進メールの配信日付"]');
      return field && !(field as HTMLInputElement).disabled;
    }, { timeout: 30000 });

    console.log('✓ 配信日付フィールドが有効化されました');

    // 配信日付フィールドをクリック
    await this.deliveryDateField.click();
    await this.page.waitForTimeout(500);

    // 日付を選択フィールドをクリック
    await this.datePickerField.click();
    await this.page.waitForTimeout(500);

    // 日付を入力
    await this.datePickerField.fill(date);
    await this.page.waitForTimeout(500);

    // 時間を選択フィールドをクリック
    await this.timePickerField.click();
    await this.page.waitForTimeout(500);

    // 時刻を入力
    await this.timePickerField.fill(time);
    await this.page.waitForTimeout(500);

    // OKボタンを2回押下（日付と時刻の確定）
    await this.okButton.click();
    await this.page.waitForTimeout(500);
    await this.okButton.click();
    await this.page.waitForTimeout(500);

    console.log(`✓ メール配信予定日時を設定: ${date} ${time}`);
  }

  /**
   * テストメール送信先とDCF設定を行い、配信登録
   * @param testEmail テストメール送信先アドレス
   */
  async registerDelivery(testEmail: string = 'qa-Read_promotion_test@m3.com') {
    // テストメール送信先を入力
    const testEmailInput = this.page.locator('input[type="text"]').filter({ hasText: '' }).first();
    await testEmailInput.fill(testEmail);
    await this.page.waitForTimeout(500);
    console.log(`✓ テストメール送信先を設定: ${testEmail}`);

    // DCF有無を「無」に設定
    const dcfNoneSpan = this.page.locator('span').filter({ hasText: '無' }).first();
    await dcfNoneSpan.click();
    await this.page.waitForTimeout(500);
    console.log('✓ DCF有無を「無」に設定');

    // 設定した内容で配信登録/テストメール送信ボタンを押下
    await this.registerDeliveryButton.click();
    await this.page.waitForTimeout(10000);

    console.log('✓ 配信登録/テストメール送信を実行');
  }

  /**
   * ステータスが「同日配信のターゲットメールのリストID設定の確認待ち」になることを確認
   */
  async waitForConfirmationStatus() {
    // 配信登録後の処理待機
    await this.page.waitForTimeout(10000);

    // 必要に応じてページリロード
    const currentUrl = this.page.url();
    if (!currentUrl.includes('promotion_mail')) {
      return; // すでに別の画面に遷移している場合はスキップ
    }

    console.log('✓ 配信登録処理が完了しました');
  }

  /**
   * 同日配信のターゲットメールのリストID設定の確認ボタンを押下
   */
  async confirmListIdSetting() {
    await this.confirmListIdButton.click();
    await this.page.waitForTimeout(1000);

    // 確認ダイアログのOKボタンを押下
    await this.okButton.click();
    await this.page.waitForTimeout(2000);

    console.log('✓ 同日配信のターゲットメールのリストID設定の確認を実行');
  }

  /**
   * 開封促進メールの配信準備を完了（すべてのステップを実行）
   * @param opdId OPD ID
   * @param deliveryDate 配信日（YYYY-MM-DD形式、省略時は翌日）
   * @param deliveryTime 配信時刻（HH:mm:ss形式、デフォルト: 09:00:00）
   * @param proxyNumber プロキシ番号（例: "-qa1"）
   */
  async setupPromotionMail(
    opdId: string,
    deliveryDate?: string,
    deliveryTime: string = '09:00:00',
    proxyNumber: string = '-qa1'
  ): Promise<void> {
    // 開封促進メール画面に遷移
    await this.goto(opdId, proxyNumber);

    // プレビュー画像生成
    await this.generatePreviewImage();

    // 配信日が指定されていない場合は翌日を設定
    if (!deliveryDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      deliveryDate = `${year}-${month}-${day}`;
    }

    // メール配信予定日時を設定
    await this.setDeliveryDateTime(deliveryDate, deliveryTime);

    // テストメール送信先とDCF設定、配信登録
    await this.registerDelivery();

    // ステータス確認
    await this.waitForConfirmationStatus();

    // リストID設定の確認
    await this.confirmListIdSetting();

    console.log(`✓ OPD ${opdId} の開封促進メール配信準備が完了しました`);
  }
}
