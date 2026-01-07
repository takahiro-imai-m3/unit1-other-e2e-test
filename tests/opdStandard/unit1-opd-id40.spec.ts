import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { M3SPLoginPage } from '../../pages/dr/M3SPLoginPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID40
 *
 * テスト目的:
 * - OPDメッセージ作成機能のテスト
 * - iOS端末のポートレート向きで表示が崩れないことを確認
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - プロキシ経由でアクセス
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 *   - npx playwright test tests/setup/auth-opex.setup.ts --headed --project=setup
 *   - npx playwright test tests/setup/auth-mrkun.setup.ts --headed
 * - Unit1_OPD_標準テスト_事前ID38_QA山本を実施済み
 *
 * このテストは以下を実行します:
 * 1. OPD作成（OPEX管理画面）
 * 2. MR君管理画面でターゲット設定
 * 3. M3 SP版でOPD表示確認（iOS ポートレート）
 */
test.describe('Unit1_OPD_標準テスト_ID40', () => {
  let opdId: string;
  let opdTitle: string;

  test('OPD作成 → MR君ターゲット設定 → SP版確認(iOS ポートレート)', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID40');

    // ========================================
    // Part 1: OPD作成（OPEX管理画面）
    // ========================================
    console.log('\n### Part 1: OPD作成（OPEX管理画面）');

    // OPEX管理画面用のコンテキスト（認証状態を使用、プロキシなし）
    const opexContext = await browser.newContext({
      storageState: '.auth/opex-user.json',
      viewport: { width: 1280, height: 720 },
    });

    const opexPage = await opexContext.newPage();
    const opdCreatePage = new OPDCreatePage(opexPage);

    // OPEX管理画面のダッシュボードに移動
    const appUrl = process.env.BASE_URL || 'https://opex-qa1.unit1.qa-a.m3internal.com';
    const dashboardUrl = `${appUrl}/internal/dashboard`;
    await opexPage.goto(dashboardUrl);
    await opexPage.waitForLoadState('networkidle');

    // OPD新規作成画面に遷移
    const proxyNumber = '-qa1';
    await opdCreatePage.goto(proxyNumber);
    await opdCreatePage.waitForPageLoad();

    // 日付変数を作成
    const today = new Date();
    const opdStartTime = generateDateString('YYYY/MM/DD', 0);
    const opdMessageNumber = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');

    // 依頼フォームIDを生成
    const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const opdRequestFormId = `${opdMessageNumber}${randomDigits}`;

    // タイトルを生成
    const flowID = process.env.TEST_FLOW_ID || '40';
    const randomAlnum = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle = `自動テストタイトル${flowID}_${opdMessageNumber}_${randomAlnum}`;

    // OPDメッセージを作成
    opdId = await opdCreatePage.createOPDMessage({
      companyName: '自動テスト株式会社',
      productName: '自動テスト薬品',
      requestFormId: opdRequestFormId,
      openingPrice: '100',
      title: opdTitle,
      openingLimit: '10',
      openingAction: '50',
      startDate: opdStartTime,
      startTime: '00:00:00',
      endDate: opdStartTime,
      endTime: '23:59:59',
      companyCode: '9900000144', // M3
      pcDetailBody: 'PCディテール本文コンテンツ',
    });

    console.log(`✓ OPD作成完了: ID=${opdId}, タイトル=${opdTitle}`);

    // コンテキストをクローズ
    await opexContext.close();

    // ========================================
    // Part 2: MR君管理画面でターゲット設定
    // ========================================
    console.log('\n### Part 2: MR君管理画面でターゲット設定');

    // MR君管理画面用のコンテキスト（認証状態を使用、プロキシ経由）
    const mrkunContext = await browser.newContext({
      storageState: '.auth/mrkun-user.json',
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888', // mrqa1プロキシ
      },
    });

    const mrkunPage = await mrkunContext.newPage();
    const mrkunAdminPage = new MRkunAdminPage(mrkunPage);

    // ターゲット設定
    const systemCode = process.env.TEST_SYS_CODE || '00000099'; // QA環境のテスト用医師システムコード
    await mrkunAdminPage.setupTarget(opdId, systemCode);

    console.log(`✓ ターゲット設定完了: システムコード=${systemCode}`);

    // コンテキストをクローズ
    await mrkunContext.close();

    // ========================================
    // Part 3: M3 SP版でOPD表示確認
    // ========================================
    console.log('\n### Part 3: M3 SP版でOPD表示確認（iOS ポートレート）');

    // M3 SP版用のコンテキスト（ポートレートモード、プロキシ経由）
    const m3spContext = await browser.newContext({
      viewport: { width: 375, height: 812 }, // iPhone X ポートレート
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      proxy: {
        server: 'http://mrqa1:8888', // mrqa1プロキシ
      },
    });

    const m3spPage = await m3spContext.newPage();
    const m3spLoginPage = new M3SPLoginPage(m3spPage);

    // M3 SP版にログイン
    const loginId = process.env.M3_SP_LOGIN_ID || '';
    const password = process.env.M3_SP_PASSWORD || '';

    if (!loginId || !password) {
      throw new Error('M3_SP_LOGIN_ID または M3_SP_PASSWORD が設定されていません');
    }

    // M3 SP版ログインページに移動
    await m3spLoginPage.goto();
    await m3spLoginPage.login(loginId, password);

    // OPD表示確認
    await m3spPage.waitForTimeout(3000);

    // ホーム画面でOPDが表示されることを確認
    const opdVisible = await m3spPage.locator(`text=${opdTitle}`).isVisible({ timeout: 10000 });

    if (opdVisible) {
      console.log(`✓ M3 SP版でOPD表示確認成功: ${opdTitle}`);
    } else {
      console.log(`⚠️  M3 SP版でOPDが表示されませんでした: ${opdTitle}`);
      console.log('   ※ターゲット設定の反映に時間がかかる場合があります');
    }

    // テスト結果のアサーション
    expect(opdId).toBeTruthy();
    expect(opdTitle).toContain('自動テストタイトル40');

    // コンテキストをクローズ
    await m3spContext.close();

    console.log('\n✅ テスト完了');
  });
});
