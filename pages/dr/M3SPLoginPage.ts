import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../common/BasePage';

/**
 * M3.com SP版 ログインページ
 * SP版M3.comへのログイン機能を提供
 */
export class M3SPLoginPage extends BasePage {
  // ログインフォーム
  readonly loginIdInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  // OPD関連
  readonly opdTopLink: Locator;
  readonly opdMessageTitle: Locator;
  readonly opdCompanyName: Locator;

  constructor(page: Page) {
    super(page);

    // ログインフォーム要素
    this.loginIdInput = page.getByPlaceholder('ログインID').or(
      page.locator('input[name*="login"], input[placeholder*="ログインID"]')
    );
    this.passwordInput = page.getByPlaceholder('パスワード').or(
      page.locator('input[type="password"], input[placeholder*="パスワード"]')
    );
    this.loginButton = page.getByRole('button', { name: 'ログイン' });

    // OPD要素
    this.opdTopLink = page.getByRole('link', { name: 'OPD' });
    this.opdMessageTitle = page.locator('span, h1').filter({ hasText: '自動テストタイトル' });
    this.opdCompanyName = page.locator('span, p').filter({ hasText: '自動テスト株式会社' });
  }

  /**
   * SP版M3.comに遷移
   */
  async goto() {
    await this.page.goto('https://sp.m3.com/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * SP版M3.comにログイン
   * @param loginId ログインID
   * @param password パスワード
   */
  async login(loginId: string, password: string) {
    await this.loginIdInput.fill(loginId);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * SP版OPDページに遷移
   */
  async gotoOPDTop() {
    await this.page.goto('https://mrkun.m3.com/sp/onepoint/top.htm');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  /**
   * OPD一覧でメッセージを確認
   * @param expectedTitle 期待するタイトル
   */
  async verifyOPDInList(expectedTitle: string) {
    // タイトルを動的に検索
    const messageTitle = this.page.locator('span', { hasText: expectedTitle });
    await expect(messageTitle).toHaveText(expectedTitle);

    // 会社名を確認
    await expect(this.opdCompanyName).toHaveText('自動テスト株式会社');
  }

  /**
   * 作成したOPD詳細ページに遷移
   * @param opdId 作成したOPDのID
   */
  async gotoOPDDetail(opdId: string) {
    const url = `https://mrkun.m3.com/sp/onepoint/${opdId}/view.htm?pageContext=smp_opd1.0&mkep=new&wid=`;
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * OPD詳細ページでメッセージを確認
   * @param expectedTitle 期待するタイトル
   */
  async verifyOPDDetail(expectedTitle: string) {
    // タイトルを動的に検索（h1タグ）
    const detailTitle = this.page.locator('h1', { hasText: expectedTitle });
    await expect(detailTitle).toHaveText(expectedTitle);

    // 会社名を確認（pタグ）
    const detailCompany = this.page.locator('p', { hasText: '自動テスト株式会社' });
    await expect(detailCompany).toHaveText('自動テスト株式会社');
  }

  /**
   * SP版M3.comログイン〜OPD確認の完全フロー
   * @param loginId ログインID
   * @param password パスワード
   * @param opdId 作成したOPDのID
   * @param expectedTitle 期待するタイトル
   */
  async loginAndVerifyOPD(
    loginId: string,
    password: string,
    opdId: string,
    expectedTitle: string
  ) {
    // SP版M3.comにログイン
    await this.goto();
    await this.login(loginId, password);

    // OPDトップページに遷移
    await this.gotoOPDTop();

    // OPD一覧で確認
    await this.verifyOPDInList(expectedTitle);

    // OPD詳細ページに遷移
    await this.gotoOPDDetail(opdId);

    // OPD詳細で確認
    await this.verifyOPDDetail(expectedTitle);
  }
}
