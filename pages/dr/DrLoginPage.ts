/**
 * m3.comログイン画面（医師画面ログイン）
 */
import { type Page, type Locator, expect } from '@playwright/test';
import { DrCommonComponent } from './component/DrCommonComponent';
import { DrTopPage } from './DrTopPage';

export class DrLoginPage {
  readonly page: Page;
  readonly common: DrCommonComponent;
  readonly loginIdInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly adSkipButton: Locator;

  /**
   * DrLoginPageのインスタンスを初期化します。
   * @param page - PlaywrightのPageオブジェクト
   */
  constructor(page: Page) {
    this.page = page;
    this.common=new DrCommonComponent(page);
    this.loginIdInput = page.getByRole('textbox', { name: 'ログインID' });
    this.passwordInput = page.getByRole('textbox', { name: 'パスワード' });
    this.loginButton = page.getByRole('button', { name: 'ログイン' });
    this.adSkipButton = page.getByRole('link', { name: 'スキップする' });
  }

  /**
   * ログインページにアクセスします。
   */
  async navigateToDrLogin() {
    await this.page.goto('https://www.m3.com/logout');
    await this.page.goto('https://www.m3.com');
  }

  /**
   * 画面へのログイン
   * @param loginId ログインID
   * @param password_val パスワード
   * @returns {Promise<Dashboard2Page>}
   */
  async login(loginId: string, password_val: string): Promise<void> {
    console.log("ログイン情報を入力");
    await this.loginIdInput.fill(loginId);
    await this.passwordInput.fill(password_val);
    await this.loginButton.click();
  }

  /**
   * 医師画面ログアウトとログインを同時に行う
   * @param loginId ログインID
   * @param password_val パスワード
   */
  async logoutAndLogin(loginId: string, password_val: string){
    await this.common.navigateToDrLogin()
    await this.login(loginId,password_val);
  }

  /**
   * 医師画面のログイン処理をします。
   * @param loginId ログインID
   * @param password_val パスワード
   * @returns {Promise<drTopPage>} m3.com TOP画面のオブジェクト
   */
  async loginToDrTopPage(loginId: string, password_val: string): Promise<DrTopPage> {
    //ユーザIDの入力、パスワードの入力、ログインボタン押下
    await this.loginIdInput.fill(loginId);
    await this.passwordInput.fill(password_val);
    await this.loginButton.click();
    try {
      // 広告ボタンが表示されるか、URLがトップページに変わるかを最大5秒待つ
      await Promise.race([
        this.adSkipButton.waitFor({ state: 'visible', timeout: 5000 }),
        this.page.waitForURL('https://www.m3.com/', { timeout: 5000 }) 
      ]);
      if (await this.adSkipButton.isVisible()) {
        await this.adSkipButton.click();
      }
    } catch (e) {
      // どちらも5秒以内に検知できなかった場合、なにもせずに処理を続行
    }

    //遷移の完了を待機
    await this.page.waitForLoadState('domcontentloaded');
    
    return new DrTopPage(this.page);
  }
}
