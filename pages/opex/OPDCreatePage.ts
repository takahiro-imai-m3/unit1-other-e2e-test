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
  readonly oneSourceCssUseRadio: Locator;
  readonly oneSourceCssNotUseRadio: Locator;

  // チェックボックス
  readonly useMedicalAffairsCheckbox: Locator;

  // Personal OPD
  readonly personalOpdClientIdSelect: Locator;
  readonly personalInsertTextSwitch: Locator;

  // QFB (Quick Feedback)
  readonly qfbUseSwitch: Locator;
  readonly qfbTitleInput: Locator;
  readonly qfbDeadlineInput: Locator;
  readonly qfbAnswerLimitInput: Locator;
  readonly qfbQuestion1TypeSelect: Locator;
  readonly qfbQuestion1ContentInput: Locator;

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
    // 1ソース用CSS（IDは推測、実際の画面で確認が必要）
    this.oneSourceCssUseRadio = page.locator('span.el-radio__label').filter({ hasText: '利用する' }).first();
    this.oneSourceCssNotUseRadio = page.locator('span.el-radio__label').filter({ hasText: '利用しない' }).first();

    // チェックボックス
    this.useMedicalAffairsCheckbox = page.locator('#useMedicalAffairs');

    // Personal OPD
    // Client IDのドロップダウンセレクト
    this.personalOpdClientIdSelect = page.locator('label:has-text("Client ID")').locator('..').locator('.el-select');
    // 差し込み文言オプションのスイッチ
    this.personalInsertTextSwitch = page.locator('label:has-text("差し込み文言オプション")').locator('..').locator('.el-switch');

    // QFB (Quick Feedback)
    // QFB利用するスイッチ - クイックフィードバックセクションの利用するスイッチ
    // ページ構造: generic [ref=e824] > generic [ref=e825]: クイックフィードバック > ... > switch "利用する"
    // 「クイックフィードバック」の見出しを含むセクション内の最初のスイッチ
    this.qfbUseSwitch = page.locator('text=クイックフィードバック').locator('..').locator('.el-switch').first();
    // QFB必須フィールド
    // ページには "*タイトル" (OPDタイトル) と "タイトル" (QFBタイトル) の2つがあるため、
    // 「クイックフィードバック詳細」セクション内のタイトルを選択
    // タイトル: (必須) 最大400文字
    this.qfbTitleInput = page.locator('text=クイックフィードバック詳細').locator('..').getByRole('textbox', { name: 'タイトル' });
    // 回答期限: (必須) yyyy/mm/dd hh:mm 形式
    this.qfbDeadlineInput = page.getByRole('textbox', { name: '回答期限' });
    // 回答上限数: (必須) 上限を設定しない場合は 0 を入力
    this.qfbAnswerLimitInput = page.getByRole('textbox', { name: '回答上限数' });
    // Q1質問タイプセレクト - comboboxとして表示されるElement UIコンポーネント
    // ページ構造: text: Q1 > combobox [ref=e893]: option "使用しない" [selected]
    this.qfbQuestion1TypeSelect = page.locator('text=Q1').locator('..').getByRole('combobox').first();
    // Q1質問内容入力フィールド - Q1タイプ選択後に表示される
    // ページ構造: text: 質問内容 > textbox "質問内容" [ref=e903]
    this.qfbQuestion1ContentInput = page.getByRole('textbox', { name: '質問内容' });

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

    // ID表示フィールド - disabled なテキストボックス
    // HTML構造: <input id="id" type="text" disabled="disabled" class="el-input__inner"/>
    // "ID"という名前のtextboxが複数あるため、CSS IDセレクター #id を使用
    this.idField = page.locator('#id');
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
    // IDフィールドが表示されるまで待機（最大30秒）
    // ページスナップショットで確認: textbox "ID" [disabled]
    try {
      await this.idField.waitFor({ state: 'visible', timeout: 30000 });
      console.log('✓ OPD作成ページのロードが完了しました');
    } catch (error) {
      console.log('⚠️  IDフィールドが30秒以内に表示されませんでした。ページをリロードします...');
      await this.page.reload();
      await this.idField.waitFor({ state: 'visible', timeout: 30000 });
      console.log('✓ OPD作成ページのロードが完了しました（リロード後）');
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
    console.log('🔘 新規作成ボタンをクリックします...');
    // 新規作成ボタンをクリック
    await this.createButton.click();

    // 確認ダイアログが表示されるまで待機
    console.log('⏳ 確認ダイアログの表示を待機しています...');
    await this.page.waitForTimeout(1000);

    // 確認ダイアログのOKボタンが表示されるまで待機してクリック
    try {
      await this.confirmOkButton.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ 確認ダイアログが表示されました。OKボタンをクリックします...');
      await this.confirmOkButton.click();
    } catch (error) {
      console.error('❌ 確認ダイアログが5秒以内に表示されませんでした');
      throw error;
    }

    // OKボタンクリック後、ダイアログが閉じるまで待機
    console.log('⏳ 確認ダイアログが閉じるのを待機しています...');
    await this.page.waitForTimeout(2000);

    // 作成完了を待つ - IDフィールドに値が設定されるまで待機（最大60秒）
    console.log('⏳ OPD作成処理の完了を待機しています（IDフィールドに値が設定されるまで、最大60秒）...');
    try {
      await this.page.waitForFunction(
        () => {
          const element = document.querySelector('#id') as HTMLInputElement;
          if (!element) return false;
          const value = element.value;
          return value && value !== '0' && value.trim() !== '';
        },
        { timeout: 60000 }
      );
      console.log('✓ OPD作成完了を検出しました');
    } catch (error) {
      console.error('❌ 60秒以内にOPD作成が完了しませんでした');
      // エラーを投げずに継続（getCreatedId()で再度チェックする）
    }
  }

  /**
   * 作成されたOPDのIDを取得
   * @returns OPD ID
   */
  async getCreatedId(): Promise<string> {
    // IDフィールドに値が設定されるまで待機（最大30秒）
    // 作成直後はIDが0または空の可能性があるため、有効な値になるまで待つ
    try {
      await this.page.waitForFunction(
        () => {
          const element = document.querySelector('#id') as HTMLInputElement;
          if (!element) return false;
          const value = element.value;
          return value && value !== '0' && value.trim() !== '';
        },
        { timeout: 30000 }
      );
    } catch (error) {
      // タイムアウトした場合、デバッグ情報を収集
      const currentUrl = this.page.url();
      const idValue = await this.idField.inputValue();
      console.error(`❌ OPD ID取得タイムアウト`);
      console.error(`   現在のURL: ${currentUrl}`);
      console.error(`   IDフィールドの値: "${idValue}"`);

      // ページ上のエラーメッセージを確認
      const errorMessages = await this.page.locator('.el-message--error, .el-message-box__message').allTextContents();
      if (errorMessages.length > 0) {
        console.error(`   エラーメッセージ: ${errorMessages.join(', ')}`);
      }

      throw new Error(`OPD IDが30秒以内に設定されませんでした (現在の値: "${idValue}", URL: ${currentUrl})`);
    }

    // IDフィールドの値を取得
    const idValue = await this.idField.inputValue();

    if (!idValue || idValue === '0' || idValue.trim() === '') {
      throw new Error(`OPD IDが取得できませんでした: idValue="${idValue}"`);
    }

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
    managementMemo?: string;  // 管理メモ（指定しない場合はtitleを使用）
    useMedicalAffairs?: boolean;
    useOneSourceCss?: boolean;
    personalOpdClientId?: string;  // Personal OPD用のClient ID（例: "37100"）
    personalInsertText?: boolean;  // 差し込み文言オプション（true/false）
    useQfb?: boolean;  // QFB機能を利用するか
    qfbTitle?: string;  // QFBタイトル（必須: 最大400文字）
    qfbDeadline?: string;  // QFB回答期限（必須: yyyy/mm/dd hh:mm 形式）
    qfbAnswerLimit?: string;  // QFB回答上限数（必須: 上限なしの場合は "0"）
    qfbQuestion1Type?: string;  // QFB Q1質問タイプ（例: "テキスト", "単一選択", "複数選択"など、省略時は"テキスト"）
    qfbQuestion1Content?: string;  // QFB Q1質問内容（最大400文字、省略時は"ご意見・ご感想をお聞かせください"）
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

    // 管理メモ（指定があればそれを使用、なければtitleを使用）
    await this.setManagementMemo(data.managementMemo || data.title);

    // 会社選択
    await this.selectCompany(data.companyCode);

    // PCディテール本文
    await this.setPcDetailBodyAndCopy(data.pcDetailBody);

    // ワンポイントMA（オプション）
    if (data.useMedicalAffairs) {
      // JavaScriptで直接チェックボックスを操作（ElementUIのスイッチコンポーネント対応）
      await this.page.evaluate(() => {
        const checkbox = document.querySelector('#useMedicalAffairs') as HTMLInputElement;
        if (checkbox && !checkbox.checked) {
          checkbox.click();
        }
      });
      await this.page.waitForTimeout(500);
    }

    // 1ソース用CSS（オプション）
    if (data.useOneSourceCss !== undefined) {
      if (data.useOneSourceCss) {
        await this.oneSourceCssUseRadio.click();
      } else {
        await this.oneSourceCssNotUseRadio.click();
      }
      await this.page.waitForTimeout(500);
    }

    // Personal OPD（オプション）
    if (data.personalOpdClientId) {
      // Client IDのドロップダウンをクリック
      await this.personalOpdClientIdSelect.click();
      await this.page.waitForTimeout(1000);

      // ドロップダウンからClient IDを選択（例: "37100 ／ Personal 医療情報（支店名）"）
      const clientIdOption = this.page.locator('.el-select-dropdown__item').filter({ hasText: data.personalOpdClientId });
      await clientIdOption.click();
      await this.page.waitForTimeout(500);

      // 差し込み文言オプション設定
      if (data.personalInsertText !== undefined) {
        // スイッチの現在の状態を確認
        const switchElement = this.personalInsertTextSwitch;
        const isChecked = await switchElement.evaluate((el) => el.classList.contains('is-checked'));

        // 希望する状態と異なる場合はクリック
        if (data.personalInsertText && !isChecked) {
          await switchElement.click();
          await this.page.waitForTimeout(500);
        } else if (!data.personalInsertText && isChecked) {
          await switchElement.click();
          await this.page.waitForTimeout(500);
        }
      }
    }

    // QFB (Quick Feedback)（オプション）
    if (data.useQfb) {
      // QFB利用スイッチをON
      const qfbSwitchElement = this.qfbUseSwitch;
      const isQfbChecked = await qfbSwitchElement.evaluate((el) => el.classList.contains('is-checked'));

      if (!isQfbChecked) {
        await qfbSwitchElement.click();
        await this.page.waitForTimeout(1000);  // QFB設定エリアの表示を待つ
      }

      // QFB必須フィールドを設定
      // 1. タイトル (必須) - 最大400文字
      if (data.qfbTitle) {
        await this.qfbTitleInput.fill(data.qfbTitle);
        await this.page.waitForTimeout(500);
      }

      // 2. 回答期限 (必須) - yyyy/mm/dd hh:mm 形式
      if (data.qfbDeadline) {
        await this.qfbDeadlineInput.fill(data.qfbDeadline);
        await this.page.waitForTimeout(500);
      }

      // 3. 回答上限数 (必須) - 上限を設定しない場合は 0
      if (data.qfbAnswerLimit) {
        await this.qfbAnswerLimitInput.fill(data.qfbAnswerLimit);
        await this.page.waitForTimeout(500);
      }

      // 4. Q1質問タイプを設定 (デフォルト: "テキスト")
      // QFB機能を使う場合、少なくとも1つの質問を設定する必要がある
      const q1Type = data.qfbQuestion1Type || 'テキスト';
      console.log(`QFB Q1質問タイプを設定します: ${q1Type}`);

      // comboboxから選択肢を選択 (ネイティブ<select>要素として扱う)
      await this.qfbQuestion1TypeSelect.selectOption({ label: q1Type });
      await this.page.waitForTimeout(500);
      console.log(`✓ Q1質問タイプを「${q1Type}」に設定しました`);

      // 5. Q1質問内容を設定 (質問タイプが「使用しない」以外の場合は必須)
      if (q1Type !== '使用しない') {
        const q1Content = data.qfbQuestion1Content || 'ご意見・ご感想をお聞かせください';
        console.log(`QFB Q1質問内容を設定します: ${q1Content}`);
        // 質問内容フィールドが表示されるまで待機
        await this.qfbQuestion1ContentInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.qfbQuestion1ContentInput.fill(q1Content);
        await this.page.waitForTimeout(500);
        console.log(`✓ Q1質問内容を設定しました`);
      }
    }

    // 作成実行
    await this.clickCreate();

    // 作成されたIDを取得
    return await this.getCreatedId();
  }

  /**
   * OPD編集画面に遷移
   * @param opdId OPD ID
   * @param proxyNumber プロキシ番号（デフォルト: '-qa1'）
   */
  async gotoEdit(opdId: string, proxyNumber: string = '-qa1') {
    const url = `https://opex-qa${proxyNumber}.unit1.qa-a.m3internal.com/internal/mrf_management/opd/edit/${opdId}`;
    await this.page.goto(url);
    await this.waitForPageLoad();
    console.log(`⏳ OPD編集画面に遷移: ID=${opdId}`);
  }

  /**
   * 開封アクションを設定
   * @param actionPoints アクションポイント
   */
  async setOpeningAction(actionPoints: string) {
    await this.openingActionInput.fill(actionPoints);
    await this.page.waitForTimeout(500);
  }

  /**
   * PCディテール本文を入力
   * @param content 本文内容
   */
  async fillPCDetail(content: string) {
    await this.pcDetailBodyInput.fill(content);
    await this.page.waitForTimeout(500);
  }

  /**
   * PCディテール本文をSPディテール本文にコピー
   */
  async copyPCDetailToSPDetail() {
    await this.copyPcToSpButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * QFB報告設定を選択
   * @param isOutput true: 出力する、false: 出力しない
   */
  async selectQfbReporting(isOutput: boolean) {
    if (isOutput) {
      // QFB報告「出力する」を選択（必要に応じて実装）
      throw new Error('QFB報告「出力する」は未実装');
    } else {
      // QFB報告「対象外（出力する）」を選択
      await this.qfbOutputFalseRadio.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 合算チェック用会社を選択
   * @param companyCode 会社コード（例: '9909000135'）
   */
  async selectBillingCompany(companyCode: string) {
    // プルダウンをクリック
    await this.page.locator('.el-select').filter({ hasText: '選択してください' }).click();
    await this.page.waitForTimeout(1000);

    // 会社コードで検索
    const searchInput = this.page.locator('.el-select-dropdown input[type="text"]').last();
    await searchInput.fill(companyCode);
    await this.page.waitForTimeout(1000);

    // 会社を選択
    await this.page.locator('.el-select-dropdown__item span').filter({ hasText: companyCode }).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * 動画コンテンツを追加
   * @param movieId 動画ID（例: 'dellegra_201501_01'）
   * @param actionPoints アクションポイント
   */
  async addMovieContent(movieId: string, actionPoints: string) {
    // コンテンツテーブルの動画行を探す
    const movieRow = this.page.locator('table tbody tr').filter({ hasText: '動画' }).first();

    // 動画IDを入力
    const movieInput = movieRow.locator('input[type="text"]').first();
    await movieInput.fill(movieId);
    await this.page.waitForTimeout(500);

    // アクションポイントを入力
    const actionInput = movieRow.locator('input[type="text"]').nth(1);
    await actionInput.fill(actionPoints);
    await this.page.waitForTimeout(500);
  }

  /**
   * その他コンテンツを追加
   * @param url URL
   * @param actionPoints アクションポイント
   */
  async addOtherContent(url: string, actionPoints: string) {
    // コンテンツテーブルのその他行で空欄のものを探す
    const otherRows = this.page.locator('table tbody tr').filter({ hasText: 'その他' });
    const count = await otherRows.count();

    for (let i = 0; i < count; i++) {
      const row = otherRows.nth(i);
      const urlInput = row.locator('input[type="text"]').first();
      const currentValue = await urlInput.inputValue();

      if (!currentValue || currentValue === '') {
        // 空欄の行が見つかった
        await urlInput.fill(url);
        await this.page.waitForTimeout(500);

        const actionInput = row.locator('input[type="text"]').nth(1);
        await actionInput.fill(actionPoints);
        await this.page.waitForTimeout(500);
        return;
      }
    }

    throw new Error('その他コンテンツの空き行が見つかりません');
  }

  /**
   * OPD Quizコンテンツを追加
   * @param url Quiz URL
   * @param actionPoints アクションポイント
   */
  async addOpdQuizContent(url: string, actionPoints: string) {
    const quizRow = this.page.locator('table tbody tr').filter({ hasText: 'OPD Quiz' }).first();

    const urlInput = quizRow.locator('input[type="text"]').first();
    await urlInput.fill(url);
    await this.page.waitForTimeout(500);

    const actionInput = quizRow.locator('input[type="text"]').nth(1);
    await actionInput.fill(actionPoints);
    await this.page.waitForTimeout(500);
  }

  /**
   * MR君・myMR君登録コンテンツを追加
   * @param url 登録URL
   * @param actionPoints アクションポイント
   */
  async addMrRegistrationContent(url: string, actionPoints: string) {
    const mrRow = this.page.locator('table tbody tr').filter({ hasText: 'MR君・myMR君登録' }).first();

    const urlInput = mrRow.locator('input[type="text"]').first();
    await urlInput.fill(url);
    await this.page.waitForTimeout(500);

    const actionInput = mrRow.locator('input[type="text"]').nth(1);
    await actionInput.fill(actionPoints);
    await this.page.waitForTimeout(500);
  }

  /**
   * 添付文書コンテンツを追加
   * @param url 添付文書URL
   * @param actionPoints アクションポイント
   */
  async addAttachmentContent(url: string, actionPoints: string) {
    const attachmentRow = this.page.locator('table tbody tr').filter({ hasText: '添付文書' }).first();

    const urlInput = attachmentRow.locator('input[type="text"]').first();
    await urlInput.fill(url);
    await this.page.waitForTimeout(500);

    const actionInput = attachmentRow.locator('input[type="text"]').nth(1);
    await actionInput.fill(actionPoints);
    await this.page.waitForTimeout(500);
  }

  /**
   * QFBを有効化して設定する
   * @param config QFB設定オブジェクト
   */
  async enableQfb(config: {
    title: string;
    defaultEmail: string;
    point: string;
    deadline: string;
    limitCount: string;
    questionType: string;
    questionContent: string;
    answer1: string;
    answer2: string;
    answer3: string;
    noteTop: string;
    noteBottom: string;
    internalNote: string;
  }) {
    // QFB利用するチェックボックスをクリック
    await this.page.locator('#useQfb').click();
    await this.page.waitForTimeout(1000);

    // タイトル
    await this.page.locator('input[name="qfb.detail.title"]').fill(config.title);

    // 回答通知先デフォルトメールアドレス
    await this.page.locator('label:has-text("回答通知先デフォルトメールアドレス")').locator('..').locator('.el-input__inner').fill(config.defaultEmail);

    // 進呈ポイント
    await this.page.locator('select[name="qfb.detail.point"]').selectOption(config.point);

    // 回答期限
    await this.page.locator('input[placeholder="回答期限"]').fill(config.deadline);

    // 回答上限数
    await this.page.locator('input[name="qfb.detail.answerUserCountLimit"]').fill(config.limitCount);

    // Q1質問タイプ（単一選択=1、複数選択=2、自由記述=3）
    await this.page.locator('select[name="qfb.detail.questions[0].questionType"]').selectOption(config.questionType);

    // 質問内容
    await this.page.locator('input[placeholder="質問内容"]').fill(config.questionContent);

    // 回答選択肢
    await this.page.locator('input[placeholder="A1(単一)"]').fill(config.answer1);
    await this.page.locator('input[placeholder="A2(単一)"]').fill(config.answer2);
    await this.page.locator('input[placeholder="A3(単一)"]').fill(config.answer3);

    // 注意書き（上）
    await this.page.locator('input[placeholder="注意書き（上）"]').fill(config.noteTop);

    // 注意書き（下）
    await this.page.locator('input[placeholder="注意書き（下）"]').fill(config.noteBottom);

    // 社内連絡欄
    await this.page.locator('textarea[placeholder="社内連絡欄"]').fill(config.internalNote);

    await this.page.waitForTimeout(1000);
    console.log('✓ QFB設定完了');
  }

  /**
   * 動画ファイルをアップロード（JW Player）
   * @param opdId OPD ID
   * @param fileName ファイル名（例: 'short movie.mp4'）
   */
  async uploadMovieFile(opdId: string, fileName: string) {
    // 動画アップロード画面に遷移
    const uploadUrl = `https://mrkun.m3.com/admin/restricted/jwplayer/upload.jsp?service=onepoint&movieId=${opdId}`;
    await this.page.goto(uploadUrl);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);

    // ファイル選択
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(fileName);
    await this.page.waitForTimeout(2000);

    // Upload & Encodeボタンをクリック
    await this.page.locator('button', { hasText: 'Upload & Encode' }).click();
    await this.page.waitForTimeout(15000); // アップロード完了待機

    // 再度アップロード画面に遷移
    await this.page.goto(uploadUrl);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);

    // 公開するボタンをクリック
    await this.page.locator('button', { hasText: '公開する' }).click();
    await this.page.waitForTimeout(3000);

    console.log(`✓ 動画ファイルアップロード完了: ${fileName}`);
  }

  /**
   * OPDを作成（簡易版）
   * 新規作成ボタンをクリックして作成されたIDを返す
   * @returns 作成されたOPD ID
   */
  async createOPD(): Promise<string> {
    await this.clickCreate();
    return await this.getCreatedId();
  }
}
