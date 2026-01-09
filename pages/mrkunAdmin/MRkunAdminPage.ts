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
    // ポップアップイベントを先に設定
    const targetPagePromise = this.page.waitForEvent('popup', { timeout: 10000 });

    // 変更リンクをクリック
    await this.changeLink.click();

    // 新しいタブが開くのを待つ
    const targetPage = await targetPagePromise;

    // タブの切り替えとロード完了を待つ
    await targetPage.waitForLoadState('domcontentloaded');
    await targetPage.waitForTimeout(2000);

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

    // システムコードがスペース区切りの場合は改行に変換
    const formattedSystemCode = systemCode.replace(/\s+/g, '\n');
    await systemCodeField.fill(formattedSystemCode);

    // 追加ボタンをクリック
    const addBtn = targetPage.getByRole('button', { name: '追加' });
    await addBtn.click();

    // ページ遷移を待つ（ターゲットリスト確認画面）
    await targetPage.waitForTimeout(3000);

    // ページタイトルを確認
    const pageTitle = await targetPage.title();
    console.log(`ページタイトル: ${pageTitle}`);

    // 「ターゲットリスト確認画面」に遷移したか確認
    if (pageTitle.includes('確認画面')) {
      console.log('✓ ターゲットリスト確認画面に遷移しました');

      // デバッグ: スクリーンショット撮影とHTML保存
      await targetPage.screenshot({ path: 'debug-confirmation-page.png', fullPage: true });
      const pageHtml = await targetPage.content();
      require('fs').writeFileSync('debug-confirmation-page.html', pageHtml);
      console.log('スクリーンショット保存: debug-confirmation-page.png');
      console.log('HTML保存: debug-confirmation-page.html');

      // 警告メッセージが存在する場合、警告チェックボックスにチェックして実行
      const hasWarning = await targetPage.locator('h3.err_msg').isVisible({ timeout: 2000 }).catch(() => false);
      if (hasWarning) {
        console.log('⚠️  警告メッセージが表示されています。警告を無視して続行します。');

        // 警告チェックボックスにチェック
        const warningCheckbox = targetPage.locator('input#warning');
        await warningCheckbox.check();
        await targetPage.waitForTimeout(1000);
        console.log('✓ 警告チェックボックスにチェックしました');

        // 実行ボタンをクリック
        const executeButton = targetPage.locator('button#register_button');
        await executeButton.click();
        console.log('✓ 実行ボタンをクリックしました');

        // 結果画面に遷移するまで待機
        await targetPage.waitForTimeout(3000);

        // 結果画面のタイトルを確認
        const resultPageTitle = await targetPage.title();
        console.log(`結果画面タイトル: ${resultPageTitle}`);

        if (resultPageTitle.includes('結果画面')) {
          console.log('✓ ターゲット追加が完了しました（結果画面表示）');
        }
      } else {
        console.log('警告メッセージはありません。実行ボタンをクリックします。');

        // 実行ボタンをクリック
        const executeButton = targetPage.locator('button#register_button');
        await executeButton.click();
        console.log('✓ 実行ボタンをクリックしました');

        // 結果画面に遷移するまで待機
        await targetPage.waitForTimeout(3000);
      }

      return; // 処理完了
    }

    // 確認画面以外の場合（エラーや警告の場合）
    console.log('⚠️  確認画面ではない別の画面が表示されました');

    // 警告チェックボックスにチェック（表示された場合のみ）
    // 重複ユーザーエラーが発生した場合、警告を無視するチェックボックスが表示される
    const warningCb = targetPage.locator('input[type="checkbox"]').first();

    const isWarningVisible = await warningCb.isVisible({ timeout: 3000 }).catch(() => false);
    if (isWarningVisible) {
      console.log('警告チェックボックスを検出、チェックを入れます');
      await warningCb.check();
      await targetPage.waitForTimeout(1000);

      // 実行ボタンを探してクリック
      const execBtn = targetPage.locator('button:has-text("実")').or(
        targetPage.locator('input[type="submit"][value*="実"]')
      ).or(
        targetPage.locator('input[type="button"][value*="実"]')
      ).first();

      const isExecBtnVisible = await execBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (isExecBtnVisible) {
        await execBtn.click();
        console.log('実行ボタンをクリックしました');
      } else {
        console.log('⚠️  実行ボタンが見つかりませんでした');
      }
    }
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

    // 結果を確認（確認画面が表示された場合はaddSystemCodeで既に閉じられているのでスキップ）
    // targetPageが閉じられていないかチェック
    if (!targetPage.isClosed()) {
      await this.verifyTargetAdditionResult(targetPage);
    } else {
      console.log('✓ ターゲット追加完了（確認画面で処理済み）');
    }

    // 元のタブに戻る
    await this.switchToMainTab();
  }
}
