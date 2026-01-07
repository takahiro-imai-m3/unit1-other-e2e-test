import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * MR君管理画面ページ
 * ワンポイント医療情報（OPD）のターゲット設定を行う
 */
export class MRkunAdminPage extends BasePage {
  // OPD一覧・検索
  readonly changeLink: Locator;
  readonly systemCodeInput: Locator;
  readonly addButton: Locator;
  readonly warningCheckbox: Locator;
  readonly executeButton: Locator;
  readonly resultTitle: Locator;

  constructor(page: Page) {
    super(page);

    // OPD一覧画面の要素
    this.changeLink = page.getByRole('link', { name: '変更...' });

    // ターゲットリスト変更画面の要素
    this.systemCodeInput = page.locator('input').filter({ hasText: 'ID' }).or(
      page.locator('input[name*="id"], input[placeholder*="ID"]')
    );
    this.addButton = page.getByRole('button').filter({ hasText: '追加' });
    this.warningCheckbox = page.getByRole('checkbox', {
      name: '警告を無視して追加を行う場合は、チェックを付けてください。'
    });
    this.executeButton = page.getByRole('button', { name: '実 行' });
    this.resultTitle = page.locator('h1', {
      hasText: 'ワンポイント医療情報管理 - ターゲットリスト変更結果画面'
    });
  }

  /**
   * OPD管理画面に遷移（検索結果ページ）
   * @param opdId 作成したOPDのID
   */
  async gotoOPDAdmin(opdId: string) {
    // 環境変数でQA環境URLを指定可能（デフォルトは本番環境）
    const mrkunBaseUrl = process.env.MRKUN_ADMIN_URL || 'https://mrkun.m3.com';
    const url = `${mrkunBaseUrl}/admin/restricted/mt/OnePointDetail/list.jsp?pointCompanyCd=&productName=&memo=&opdId=${opdId}&action=view`;
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(5000);
  }

  /**
   * ターゲットリスト変更画面を開く
   */
  async openTargetListChange() {
    await this.changeLink.click();

    // 新しいタブが開くのを待つ
    const targetPagePromise = this.page.waitForEvent('popup');
    const targetPage = await targetPagePromise;

    // タブの切り替え
    await targetPage.waitForLoadState('domcontentloaded');

    return targetPage;
  }

  /**
   * ターゲットリスト変更画面でシステムコードを追加
   * @param targetPage ターゲットリスト変更画面のPage
   * @param systemCode 医師のシステムコード
   */
  async addSystemCode(targetPage: Page, systemCode: string) {
    // システムコード入力（テキストエリア）
    const systemCodeField = targetPage.locator('textarea[name="targetPersonCode"]').or(
      targetPage.locator('textarea')
    ).first();

    await systemCodeField.fill(systemCode);

    // 追加ボタンをクリック
    const addBtn = targetPage.getByRole('button', { name: '追加' });
    await addBtn.click();

    // 少し待機（警告チェックボックスが表示されるまで）
    await targetPage.waitForTimeout(2000);

    // 警告チェックボックスにチェック（表示された場合のみ）
    // 重複ユーザーエラーが発生した場合、警告を無視するチェックボックスが表示される
    const warningCb = targetPage.locator('input[type="checkbox"]').first();

    const isWarningVisible = await warningCb.isVisible({ timeout: 3000 }).catch(() => false);
    if (isWarningVisible) {
      await warningCb.check();
      await targetPage.waitForTimeout(1000);
    }

    // 実行ボタンをクリック
    const execBtn = targetPage.getByRole('button', { name: '実 行' });
    await execBtn.click();
  }

  /**
   * ターゲット追加結果を確認
   * @param targetPage ターゲットリスト変更画面のPage
   */
  async verifyTargetAdditionResult(targetPage: Page) {
    const resultH1 = targetPage.locator('h1', {
      hasText: 'ワンポイント医療情報管理 - ターゲットリスト変更結果画面 (テスト環境)'
    });
    await expect(resultH1).toBeVisible();
    await expect(resultH1).toHaveText('ワンポイント医療情報管理 - ターゲットリスト変更結果画面 (テスト環境)');
  }

  /**
   * 元のタブ（OPD一覧）に戻る
   */
  async switchToMainTab() {
    // 最初のタブに切り替え
    await this.page.bringToFront();

    // OPD一覧画面のタイトルをクリック（スイッチ確認）
    const opdListTitle = this.page.locator('h1', {
      hasText: 'ワンポイント医療情報管理 - 一覧画面 (テスト環境)'
    });
    await opdListTitle.click();
  }

  /**
   * ターゲット設定の完全フロー
   * @param opdId 作成したOPDのID
   * @param systemCode 医師のシステムコード
   */
  async setupTarget(opdId: string, systemCode: string) {
    // OPD管理画面に遷移
    await this.gotoOPDAdmin(opdId);

    // ターゲットリスト変更画面を開く
    const targetPage = await this.openTargetListChange();

    // システムコードを追加
    await this.addSystemCode(targetPage, systemCode);

    // 結果を確認
    await this.verifyTargetAdditionResult(targetPage);

    // 元のタブに戻る
    await this.switchToMainTab();
  }
}
