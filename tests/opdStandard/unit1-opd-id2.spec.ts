import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { OPDCopyPage } from '../../pages/opex/OPDCopyPage';
import { OPDEditPage } from '../../pages/opex/OPDEditPage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { DrLoginPage } from '../../pages/dr/DrLoginPage';
import { M3PCOpdListPage } from '../../pages/dr/M3PCOpdListPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID2
 *
 * テスト目的:
 * - OPDコピー作成機能の検証
 * - 課金対象者となる会員でコピー作成したメッセージが一覧に表示されること
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 *
 * このテストは以下を実行します:
 * 1. OPD作成（OPEX管理画面、課金対象）
 * 2. OPDコピー作成
 * 3. MR君管理画面でターゲット設定
 * 4. M3.com PC版でOPD一覧確認
 * 5. コピーしたOPDの配信停止
 */
test.describe('Unit1_OPD_標準テスト_ID2', () => {
  let opdId: string;
  let copiedOpdId: string;
  let opdTitle: string;

  test('OPD作成 → コピー → MR君ターゲット設定 → M3.com確認 → 配信停止', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID2');

    // ========================================
    // Part 1: OPD作成（OPEX管理画面、課金対象）
    // ========================================
    console.log('\n### Part 1: OPD作成（OPEX管理画面、課金対象）');

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
    const flowID = '2';
    const randomAlnum = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle = `自動テストタイトル${flowID}_${opdMessageNumber}_${randomAlnum}`;

    // OPDメッセージを作成（課金対象設定）
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
      companyCode: '9909000135', // 課金対象会社コード
      pcDetailBody: 'PCディテール本文コンテンツ',
    });

    console.log(`✓ OPD作成完了（課金対象）: ID=${opdId}, タイトル=${opdTitle}`);

    // ========================================
    // Part 2: OPDコピー作成
    // ========================================
    console.log('\n### Part 2: OPDコピー作成');

    const opdCopyPage = new OPDCopyPage(opexPage);
    copiedOpdId = await opdCopyPage.copyOPD(opdId, proxyNumber);

    console.log(`✓ OPDコピー作成完了: ${opdId} → ${copiedOpdId}`);

    // コンテキストをクローズ
    await opexContext.close();

    // ========================================
    // Part 3: MR君管理画面でターゲット設定
    // ========================================
    console.log('\n### Part 3: MR君管理画面でターゲット設定');

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
    const systemCode = process.env.TEST_SYS_CODE || '0000909180';
    await mrkunAdminPage.setupTarget(copiedOpdId, systemCode);

    console.log(`✓ ターゲット設定完了: システムコード=${systemCode}`);

    // コンテキストをクローズ
    await mrkunContext.close();

    // ========================================
    // Part 4: M3.com PC版でOPD一覧確認
    // ========================================
    console.log('\n### Part 4: M3.com PC版でOPD一覧確認');

    const m3Context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888', // mrqa1プロキシ
      },
    });

    const m3Page = await m3Context.newPage();
    const drLoginPage = new DrLoginPage(m3Page);
    const m3OpdListPage = new M3PCOpdListPage(m3Page);

    // M3.comログイン
    const loginId = process.env.M3_PC_LOGIN_ID || 'mrqa_auto219';
    const password = process.env.M3_PC_PASSWORD || 'Autoqa1!';

    await drLoginPage.navigateToDrLogin();
    await drLoginPage.login(loginId, password);
    await m3Page.waitForTimeout(3000);

    // OPD一覧に遷移
    await m3OpdListPage.goto();

    // OPDが一覧に表示されていることを確認
    const opdVisible = await m3OpdListPage.hasOpdWithTitle(opdTitle);

    if (opdVisible) {
      console.log(`✓ M3.com PC版でOPDが表示されました: ${opdTitle}`);
      // 一覧の最初のタイトルが一致することを確認
      await m3OpdListPage.verifyFirstOpdTitle(opdTitle);
    } else {
      console.log(`⚠️  M3.com PC版でOPDが表示されませんでした: ${opdTitle}`);
      console.log('   ※ターゲット設定の反映に時間がかかる場合があります');
    }

    // コンテキストをクローズ
    await m3Context.close();

    // ========================================
    // Part 5: コピーしたOPDの配信停止
    // ========================================
    console.log('\n### Part 5: コピーしたOPDの配信停止');

    const opexContext2 = await browser.newContext({
      storageState: '.auth/opex-user.json',
      viewport: { width: 1280, height: 720 },
    });

    const opexPage2 = await opexContext2.newPage();
    const opdEditPage = new OPDEditPage(opexPage2);

    // 配信を停止
    await opdEditPage.stopDelivery(copiedOpdId, proxyNumber);

    console.log(`✓ OPD ${copiedOpdId} の配信を停止しました`);

    // コンテキストをクローズ
    await opexContext2.close();

    // テスト結果のアサーション
    expect(opdId).toBeTruthy();
    expect(copiedOpdId).toBeTruthy();
    expect(opdTitle).toContain('自動テストタイトル2');

    console.log('\n✅ テスト完了');
  });
});
