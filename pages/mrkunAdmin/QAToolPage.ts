import { Page } from '@playwright/test';

/**
 * QA用ツールページ
 * OPD標準テスト事前準備（OPD確率予測モデル登録）を実行
 */
export class QAToolPage {
  constructor(private page: Page) {}

  /**
   * OPD確率予測モデル登録（CA設定用）
   * @param systemCd システムコード（例: 901584, 901910）
   * @param proxy プロキシ文字列（例: "-qa1"）
   */
  async registerOpdAlgorithmType(systemCd: string, proxy: string = '1') {
    const url = `http://mrqa${proxy}/admin/qa/registerOpdAlgorithmType.jsp?systemCd2=${systemCd}`;
    console.log(`⏳ OPD確率予測モデル登録: システムコード=${systemCd}`);

    await this.page.goto(url);
    await this.page.waitForTimeout(3000);

    // 登録完了を確認
    const bodyText = await this.page.locator('body').innerText();
    if (bodyText.includes('登録完了')) {
      console.log(`✓ OPD確率予測モデル登録完了: systemCd=${systemCd}`);
    } else {
      console.log(`⚠️  登録完了メッセージが見つかりません`);
      console.log(`ページ内容: ${bodyText.substring(0, 200)}...`);
    }

    return bodyText.includes('登録完了');
  }

  /**
   * 登録完了メッセージの確認
   * @param systemCd システムコード
   */
  async verifyRegistrationComplete(systemCd: string): Promise<boolean> {
    const bodyText = await this.page.locator('body').innerText();
    const isComplete = bodyText.includes('登録完了') && bodyText.includes(`systemCd=${systemCd}`);

    if (isComplete) {
      console.log(`✓ システムコード ${systemCd} の登録完了を確認`);
    } else {
      console.log(`⚠️  システムコード ${systemCd} の登録完了が確認できません`);
    }

    return isComplete;
  }

  /**
   * MR登録を解除
   * @param loginId ログインID（例: mrqa_auto048）
   * @param mrId MR-ID（例: LIBONE）
   * @param proxy プロキシ文字列（例: "1"）
   */
  async rollbackRegisteredMr(loginId: string, mrId: string, proxy: string = '1') {
    const url = `http://mrqa${proxy}:7001/admin/qa/`;
    console.log(`⏳ MR登録解除: loginId=${loginId}, mrId=${mrId}`);

    await this.page.goto(url);
    await this.page.waitForTimeout(2000);

    // Login Id入力
    await this.page.locator('#rollbackRegisteredMr_loginId').fill(loginId);

    // MR-ID入力
    await this.page.locator('#rollbackRegisteredMr_mrId').fill(mrId);

    // 実行ボタン押下
    await this.page.locator('button', { hasText: '実行' }).click();
    await this.page.waitForTimeout(3000);

    console.log(`✓ MR登録解除完了: loginId=${loginId}, mrId=${mrId}`);
  }
}
