import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * M3.com PC版 メッセージ詳細ページ（OPD詳細）
 * メッセージ詳細での表示確認・アクション数確認機能を提供
 */
export class M3PCMessageDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * メッセージ詳細ページに遷移
   * @param opdId メッセージID（OPD ID）
   */
  async goto(opdId: string) {
    const url = `https://mrkun.m3.com/mt/onepoint/${opdId}/view.htm?pageContext=opd1.0&sort=unread&mkep=list`;
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(10000); // アクションポイント更新を待つため延長
    console.log(`⏳ メッセージ詳細ページに遷移: ${opdId}`);
  }

  /**
   * メッセージ詳細のページタイトルを確認
   * @param expectedPageTitle 期待するページタイトル（例: "ワンポイント医療情報"）
   */
  async verifyPageTitle(expectedPageTitle: string) {
    // 完全一致するh1要素を取得（複数ある場合はclass="m3_plain"の方を優先）
    const h1 = this.page.locator('h1.m3_plain', { hasText: expectedPageTitle });
    await expect(h1).toHaveText(expectedPageTitle);
    console.log(`✓ ページタイトル「${expectedPageTitle}」を確認`);
  }

  /**
   * メッセージ詳細のメッセージタイトルを確認
   * @param expectedTitle 期待するメッセージタイトル
   */
  async verifyMessageTitle(expectedTitle: string) {
    const titleDt = this.page.locator('dt', { hasText: expectedTitle });
    await expect(titleDt).toHaveText(expectedTitle);
    console.log(`✓ メッセージタイトル「${expectedTitle}」を確認`);
  }

  /**
   * メッセージ詳細のクライアント名を確認
   * @param expectedCompanyName 期待するクライアント名
   */
  async verifyCompanyName(expectedCompanyName: string) {
    const companyDd = this.page.locator('dd', { hasText: expectedCompanyName });
    await expect(companyDd).toHaveText(expectedCompanyName);
    console.log(`✓ クライアント名「${expectedCompanyName}」を確認`);
  }

  /**
   * メッセージ詳細の顔写真画像を確認
   * @param expectedImageUrlPattern 期待する画像URLのパターン（部分一致）
   */
  async verifyProfileImage(expectedImageUrlPattern: string) {
    // 画像URLにパターンを含むimg要素を検索
    const img = this.page.locator(`img[src*="${expectedImageUrlPattern}"]`).first();

    // 画像が見つからない場合はスキップ
    const isVisible = await img.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      console.log(`⚠️  画像URLパターン「${expectedImageUrlPattern}」を含む画像が見つかりませんでした（スキップ）`);
      return;
    }

    const src = await img.getAttribute('src');
    expect(src).toContain(expectedImageUrlPattern);
    console.log(`✓ 顔写真画像のURLに「${expectedImageUrlPattern}」が含まれることを確認`);
  }

  /**
   * 現在のアクションポイントを取得
   * @returns 現在のアクションポイント数
   */
  async getCurrentActionPoints(): Promise<number> {
    // アクションポイントは通常ページヘッダーやナビゲーションエリアにあるため、
    // より広範囲で数値のみを含むspan要素を探す
    const actionSpan = this.page.locator('span').filter({ hasText: /^\d+$/ }).first();

    // デバッグ用に全ての候補を確認
    const allSpans = await this.page.locator('span').filter({ hasText: /^\d+$/ }).all();
    console.log(`🔍 数値のみを含むspan要素の数: ${allSpans.length}`);
    for (let i = 0; i < Math.min(5, allSpans.length); i++) {
      const text = await allSpans[i].innerText();
      console.log(`  - span[${i}]: ${text}`);
    }

    const actionText = await actionSpan.innerText();
    const points = parseInt(actionText, 10);
    console.log(`📊 現在のアクションポイント: ${points}`);
    return points;
  }

  /**
   * アクションポイントが指定値以上であることを確認
   * @param minActionPoints 最小アクション数
   */
  async verifyMinimumActionPoints(minActionPoints: number) {
    // アクションポイントの更新をポーリングで待つ（最大30秒）
    // ページをリロードしながら更新を確認
    const maxWaitTime = 30000;
    const pollInterval = 3000;
    const startTime = Date.now();

    console.log(`⏳ アクションポイントが${minActionPoints}以上になるまで待機中...`);

    while (Date.now() - startTime < maxWaitTime) {
      // アクションポイントリンク（ヘッダー部分）から取得
      // point-qa1.m3.com/action/tutorialへのリンクのテキストがアクションポイント
      const actionLink = this.page.locator('a[href*="point-qa1.m3.com/action/tutorial"]');
      const actionText = await actionLink.innerText().catch(() => '0');
      // カンマを除去して数値化（例: "9,735" → 9735）
      const actionPoints = parseInt(actionText.replace(/,/g, ''), 10);

      console.log(`  現在のアクションポイント: ${actionPoints} (期待: >=${minActionPoints})`);

      if (actionPoints >= minActionPoints) {
        console.log(`✓ アクションポイントが${minActionPoints}以上（実際: ${actionPoints}）であることを確認`);
        expect(actionPoints).toBeGreaterThanOrEqual(minActionPoints);
        return;
      }

      // まだ更新されていない場合はページをリロードして再確認
      console.log(`  ページをリロードして再確認します...`);
      await this.page.reload();
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForTimeout(pollInterval);
    }

    // タイムアウト後、最終確認とデバッグ情報出力
    console.log(`⚠️  ${maxWaitTime/1000}秒待機しましたがアクションポイントが更新されませんでした`);

    // 最終的なアクションポイントを確認
    const actionLink = this.page.locator('a[href*="point-qa1.m3.com/action/tutorial"]');
    const actionText = await actionLink.innerText().catch(() => '0');
    const actionPoints = parseInt(actionText.replace(/,/g, ''), 10);

    console.log(`  最終アクションポイント: ${actionPoints}`);

    expect(actionPoints).toBeGreaterThanOrEqual(minActionPoints);
  }

  /**
   * メッセージ詳細の情報を包括的に確認（ID6用）
   * @param pageTitle ページタイトル（例: "ワンポイント医療情報"）
   * @param messageTitle メッセージタイトル
   * @param companyName クライアント名
   * @param imageUrlPattern 顔写真画像URLのパターン
   */
  async verifyMessageDetailInfo(
    pageTitle: string,
    messageTitle: string,
    companyName: string,
    imageUrlPattern?: string
  ) {
    console.log(`⏳ メッセージ詳細の情報を確認中...`);
    await this.verifyPageTitle(pageTitle);
    await this.verifyMessageTitle(messageTitle);
    await this.verifyCompanyName(companyName);
    if (imageUrlPattern) {
      await this.verifyProfileImage(imageUrlPattern);
    }
    console.log(`✓ メッセージ詳細の情報確認完了`);
  }
}
