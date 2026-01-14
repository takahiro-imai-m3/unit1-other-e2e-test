import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * M3.com PC版 メッセージ一覧ページ（OPD一覧）
 * メッセージ一覧での表示確認・アクション数確認機能を提供
 */
export class M3PCMessageListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * メッセージ一覧ページに遷移
   */
  async goto() {
    await this.page.goto('https://mrkun.m3.com/mt/onepoint/top.htm?tc=sub-m3com');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  /**
   * 指定されたタイトルのメッセージが一覧に表示されているか確認
   * @param title メッセージタイトル
   * @returns タイトルが見つかった場合true
   */
  async hasMessageWithTitle(title: string): Promise<boolean> {
    try {
      const titleLocator = this.page.locator('a', { hasText: title });
      return await titleLocator.isVisible({ timeout: 10000 });
    } catch {
      return false;
    }
  }

  /**
   * メッセージ一覧の最初のメッセージタイトルを確認
   * @param expectedTitle 期待するタイトル
   */
  async verifyFirstMessageTitle(expectedTitle: string) {
    // メインリスト内のタイトルリンクを優先的に検索（#opd30_list_div内）
    const mainListTitleLink = this.page.locator('#opd30_list_div a', { hasText: expectedTitle });

    // タイムアウトを延長し、リトライロジックを追加
    const maxRetries = 6; // リトライ回数を増やす
    for (let i = 0; i < maxRetries; i++) {
      const isVisible = await mainListTitleLink.isVisible({ timeout: 15000 }).catch(() => false);

      if (isVisible) {
        await expect(mainListTitleLink).toHaveText(expectedTitle);
        console.log(`✓ メッセージ一覧にタイトル「${expectedTitle}」が表示されていることを確認`);
        return;
      }

      if (i < maxRetries - 1) {
        console.log(`⏳ メッセージが見つかりません。ページをリロードして再試行します (${i + 1}/${maxRetries - 1})`);
        await this.page.reload();
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForTimeout(10000); // 待機時間を延長
      }
    }

    // 最終的に見つかりません。デバッグ情報を出力
    console.log(`❌ メッセージ「${expectedTitle}」が見つかりませんでした`);
    console.log(`現在のURL: ${this.page.url()}`);
    await expect(mainListTitleLink).toHaveText(expectedTitle, { timeout: 5000 });
  }

  /**
   * メッセージ一覧でクライアント名を確認
   * @param expectedCompanyName 期待するクライアント名
   */
  async verifyCompanyName(expectedCompanyName: string) {
    const companyCell = this.page.locator('td', { hasText: expectedCompanyName }).first();
    await expect(companyCell).toHaveText(expectedCompanyName);
    console.log(`✓ クライアント名「${expectedCompanyName}」が表示されていることを確認`);
  }

  /**
   * メッセージ一覧で受信日を確認
   * @param expectedDate 期待する受信日
   */
  async verifyReceivedDate(expectedDate: string) {
    const dateCell = this.page.locator('td', { hasText: expectedDate }).first();
    await expect(dateCell).toHaveText(expectedDate);
    console.log(`✓ 受信日「${expectedDate}」が表示されていることを確認`);
  }

  /**
   * メッセージ一覧で開封アクション数が指定値以上であることを確認
   * @param minActionPoints 最小アクション数
   */
  async verifyMinimumActionPoints(minActionPoints: number) {
    // 開封アクション数のセルを取得（テーブル内の数値を含むtd要素）
    const actionCell = this.page.locator('td').filter({ hasText: /^\d+$/ }).first();
    const actionText = await actionCell.innerText();
    const actionPoints = parseInt(actionText, 10);

    expect(actionPoints).toBeGreaterThanOrEqual(minActionPoints);
    console.log(`✓ 開封アクション数が${minActionPoints}以上（実際: ${actionPoints}）であることを確認`);
  }

  /**
   * 現在のアクションポイントを取得
   * @returns 現在のアクションポイント数
   */
  async getCurrentActionPoints(): Promise<number> {
    const actionSpan = this.page.locator('span').filter({ hasText: /^\d+$/ }).first();
    const actionText = await actionSpan.innerText();
    const points = parseInt(actionText, 10);
    console.log(`📊 現在のアクションポイント: ${points}`);
    return points;
  }

  /**
   * メッセージ一覧の情報を包括的に確認（ID1, ID5用）
   * @param title メッセージタイトル
   * @param companyName クライアント名
   * @param receivedDate 受信日
   * @param minActionPoints 最小アクション数
   */
  async verifyMessageInfo(
    title: string,
    companyName: string,
    receivedDate: string,
    minActionPoints: number
  ) {
    console.log(`⏳ メッセージ一覧の情報を確認中...`);
    await this.verifyFirstMessageTitle(title);
    await this.verifyCompanyName(companyName);
    await this.verifyReceivedDate(receivedDate);
    await this.verifyMinimumActionPoints(minActionPoints);
    console.log(`✓ メッセージ一覧の情報確認完了`);
  }

  /**
   * 指定されたタイトルのメッセージをクリックして詳細ページに遷移
   * @param title メッセージタイトル
   */
  async clickMessageByTitle(title: string) {
    console.log(`⏳ メッセージ「${title}」をクリック`);
    const messageLink = this.page.locator('a', { hasText: title });
    await messageLink.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
    console.log(`✓ メッセージ詳細ページに遷移`);
  }
}
