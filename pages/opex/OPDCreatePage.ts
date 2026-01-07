import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * OPD新規作成ページ
 * OPDメッセージの新規作成に特化したPage Object
 */
export class OPDCreatePage extends BasePage {
  // フォーム要素
  readonly companyNameInput: Locator;
  readonly productNameInput: Locator;
  readonly requestFormIdInput: Locator;
  readonly openingPriceInput: Locator;
  readonly titleInput: Locator;
  readonly openingLimitInput: Locator;
  readonly managementMemoInput: Locator;
  readonly openingActionInput: Locator;
  readonly pcDetailBodyInput: Locator;

  // ラジオボタン
  readonly deliveryStatusDisplayRadio: Locator;
  readonly messageTypeNormalOpdRadio: Locator;
  readonly embeddedMovieUsePcSpOneTagRadio: Locator;
  readonly qfbOutputFalseRadio: Locator;

  // 日時ピッカー
  readonly startDateTimeField: Locator;
  readonly endDateTimeField: Locator;
  readonly datePickerInput: Locator;
  readonly timePickerInput: Locator;
  readonly dateTimeOkButton: Locator;

  // ボタン
  readonly deliveryEndDateButton: Locator;
  readonly copyPcToSpButton: Locator;
  readonly createButton: Locator;
  readonly confirmOkButton: Locator;

  // 会社選択
  readonly companySelectField: Locator;
  readonly companySearchInput: Locator;

  // ID表示フィールド
  readonly idField: Locator;

  constructor(page: Page) {
    super(page);

    // 基本情報入力フィールド
    // Playwright Codegenで生成されたセレクターを使用
    this.companyNameInput = page.getByRole('textbox', { name: '*会社名' });
    this.productNameInput = page.getByRole('textbox', { name: '*製品名' });
    this.requestFormIdInput = page.getByRole('textbox', { name: '依頼フォームID' });
    // 数値入力フィールドはspinbuttonタイプなのでIDセレクターを使用
    this.openingPriceInput = page.locator('#openUnitPrice').getByRole('spinbutton');
    this.titleInput = page.getByRole('textbox', { name: '*タイトル' });
    this.openingLimitInput = page.locator('#openUserCountLimit').getByRole('spinbutton');
    this.managementMemoInput = page.getByRole('textbox', { name: '管理メモ' });
    this.openingActionInput = page.getByRole('textbox', { name: '開封アクション' });
    this.pcDetailBodyInput = page.getByRole('textbox', { name: 'PCディテール本文' });

    // ラジオボタン
    this.deliveryStatusDisplayRadio = page.locator('#isInDelivery_deliveryStatusDisplayed > span.el-radio__label');
    this.messageTypeNormalOpdRadio = page.locator('#messageType_messageTypeNormalOpd > span.el-radio__label');
    this.embeddedMovieUsePcSpOneTagRadio = page.locator('#useEmbeddedMovie_doUseEmbeddedMoviePcSpOneTag > span.el-radio__label');
    this.qfbOutputFalseRadio = page.locator('#reportingQfbOutput_reportingQfbOutputFalse > span.el-radio__label');

    // 日時ピッカー (Playwright Codegenで生成されたセレクターを使用)
    this.startDateTimeField = page.getByRole('textbox', { name: '*開始日時' });
    this.endDateTimeField = page.getByRole('textbox', { name: '*終了日時' });
    this.datePickerInput = page.getByRole('textbox', { name: '日付を選択' });
    this.timePickerInput = page.getByRole('textbox', { name: '時間を選択' });
    this.dateTimeOkButton = page.getByRole('button', { name: 'OK' });

    // ボタン
    this.deliveryEndDateButton = page.getByRole('button', { name: '配信終了日' });
    this.copyPcToSpButton = page.getByRole('button', { name: 'PCディテール本文をSPディテール本文にコピーする' });
    this.createButton = page.getByRole('button', { name: '新規作成' });
    this.confirmOkButton = page.getByRole('button', { name: 'OK' });

    // 会社選択 - 「合算チェック用会社」のドロップダウンフィールド
    this.companySelectField = page.locator('label:has-text("合算チェック用会社")').locator('..').getByPlaceholder('選択してください');
    this.companySearchInput = page.locator('.el-select-dropdown__wrap input[type="text"]');

    // ID表示フィールド
    this.idField = page.locator('input').filter({ hasText: 'ID' }).or(
      page.locator('input[name="id"], input#id')
    );
  }

  /**
   * OPD新規作成画面に遷移
   * @param proxyNumber プロキシ番号（例: "-qa1"）
   */
  async goto(proxyNumber: string = '-qa1') {
    await this.page.goto(`https://opex${proxyNumber}.unit1.qa-a.m3internal.com/internal/mrf_management/opd/create`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * ページがロードされるまで待機
   * ID項目が表示されない場合はリロード
   */
  async waitForPageLoad() {
    await this.page.waitForTimeout(10000);

    // IDラベルが表示されているか確認
    const idLabel = this.page.locator('label', { hasText: 'ID' });
    const isVisible = await idLabel.isVisible().catch(() => false);

    if (!isVisible) {
      // ページをリロード
      await this.page.reload();
      await this.page.waitForSelector('label:has-text("ID")', { timeout: 15000 });
    }
  }

  /**
   * 基本情報を入力
   */
  async fillBasicInfo(data: {
    companyName: string;
    productName: string;
    requestFormId: string;
    openingPrice: string;
    title: string;
    openingLimit: string;
    openingAction?: string;
  }) {
    await this.companyNameInput.fill(data.companyName);
    await this.productNameInput.fill(data.productName);
    await this.requestFormIdInput.fill(data.requestFormId);
    await this.openingPriceInput.fill(data.openingPrice);
    await this.titleInput.fill(data.title);
    await this.openingLimitInput.fill(data.openingLimit);

    // 開封アクションフィールドが存在する場合のみ入力
    if (data.openingAction) {
      const isVisible = await this.openingActionInput.isVisible().catch(() => false);
      if (isVisible) {
        await this.openingActionInput.fill(data.openingAction);
      }
    }
  }

  /**
   * 日時を設定
   * @param isStartTime 開始日時ならtrue、終了日時ならfalse
   * @param date 日付（YYYY/MM/DD形式）
   * @param time 時刻（HH:MM:SS形式）
   */
  async setDateTime(isStartTime: boolean, date: string, time: string) {
    // 日時フィールドをクリック
    const dateTimeField = isStartTime ? this.startDateTimeField : this.endDateTimeField;
    await dateTimeField.click();

    // カレンダーが表示されるまで待機
    await this.page.waitForTimeout(1000);

    // 日付と時間を直接入力する方式に変更
    // カレンダーのクリックではなく、入力フィールドに直接値を設定

    // 日付タブをクリック
    await this.datePickerInput.first().click();
    await this.page.waitForTimeout(300);

    // 日付を入力（既存の値をクリアしてから入力）
    await this.datePickerInput.first().clear();
    await this.datePickerInput.first().fill(date);

    // 時間タブに切り替え
    await this.timePickerInput.first().click();
    await this.page.waitForTimeout(300);

    // 時間を入力
    await this.timePickerInput.first().clear();
    await this.timePickerInput.first().fill(time);

    // OKボタンをクリック
    await this.dateTimeOkButton.first().click();
  }

  /**
   * 会社を選択
   * @param companyCode 会社コード（例: "9900000144"）
   */
  async selectCompany(companyCode: string) {
    // 「合算チェック用会社」フィールドをクリック
    await this.companySelectField.click();

    // ドロップダウンが表示されるまで待機
    await this.page.waitForTimeout(1000);

    // ドロップダウンから会社コードを含むオプションを選択
    // 表示形式: "9900000144: M3"
    const companyOption = this.page.locator('.el-select-dropdown__item', { hasText: companyCode }).first();
    await companyOption.click();
  }

  /**
   * ラジオボタンをすべて設定
   */
  async selectRadioOptions() {
    // 配信ステータスの表示
    await this.deliveryStatusDisplayRadio.first().click();

    // メッセージ種類: 通常OPD
    await this.messageTypeNormalOpdRadio.first().click();

    // 埋め込み動画: 利用する（PCもSPもワンタグ）
    await this.embeddedMovieUsePcSpOneTagRadio.first().click();

    // QFB100回答無償CP: 対象外
    await this.qfbOutputFalseRadio.first().click();
  }

  /**
   * PCディテール本文を入力してSPにコピー
   */
  async setPcDetailBodyAndCopy(content: string) {
    await this.pcDetailBodyInput.fill(content);
    await this.copyPcToSpButton.click();
  }

  /**
   * 管理メモを入力
   */
  async setManagementMemo(memo: string) {
    await this.managementMemoInput.fill(memo);
  }

  /**
   * 配信終了日ボタンをクリック
   */
  async clickDeliveryEndDate() {
    await this.deliveryEndDateButton.click();
  }

  /**
   * OPDを新規作成
   */
  async clickCreate() {
    await this.createButton.click();
    await this.confirmOkButton.click();

    // 作成完了を待つ（20秒）
    await this.page.waitForTimeout(20000);
  }

  /**
   * 作成されたOPDのIDを取得
   * @returns OPD ID
   */
  async getCreatedId(): Promise<string> {
    // IDが0でないことを確認
    const idValue = await this.idField.inputValue();
    expect(idValue).not.toBe('0');

    return idValue;
  }

  /**
   * OPDを一括作成（すべてのステップを実行）
   */
  async createOPDMessage(data: {
    companyName: string;
    productName: string;
    requestFormId: string;
    openingPrice: string;
    title: string;
    openingLimit: string;
    openingAction?: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    companyCode: string;
    pcDetailBody: string;
  }): Promise<string> {
    // 基本情報入力
    await this.fillBasicInfo({
      companyName: data.companyName,
      productName: data.productName,
      requestFormId: data.requestFormId,
      openingPrice: data.openingPrice,
      title: data.title,
      openingLimit: data.openingLimit,
      ...(data.openingAction && { openingAction: data.openingAction }),
    });

    // 開始日時設定（ラジオボタンより先に設定）
    await this.setDateTime(true, data.startDate, data.startTime);

    // 終了日時設定
    await this.setDateTime(false, data.endDate, data.endTime);

    // ラジオボタン選択（日時設定後に実行）
    await this.selectRadioOptions();

    // 配信終了日
    await this.clickDeliveryEndDate();

    // 管理メモ
    await this.setManagementMemo(data.title);

    // 会社選択
    await this.selectCompany(data.companyCode);

    // PCディテール本文
    await this.setPcDetailBodyAndCopy(data.pcDetailBody);

    // 作成実行
    await this.clickCreate();

    // 作成されたIDを取得
    return await this.getCreatedId();
  }
}
