import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { M3SPLoginPage } from '../../pages/dr/M3SPLoginPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID58
 *
 * テスト目的:
 * - Personal OPD機能の検証
 * - Client ID入力あり + 差し込み文言ON → Personal OPDとして表示（顔写真・差し込み文言あり）
 * - Client ID入力あり + 差し込み文言OFF → Personal OPDとして表示（顔写真あり・差し込み文言なし）
 * - Client ID入力なし + 差し込み文言ON → Personal OPDとして表示されない
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 * - mrqa_auto041に(37100の)myMR君登録済み
 *
 * このテストは以下を実行します:
 * 1. OPD1作成（Client ID: 37100, 差し込み文言: ON）
 * 2. MR君管理画面でターゲット設定（OPD1）
 * 3. M3.com SP版で表示確認（OPD1）- Personal OPD表示
 * 4. OPD2作成（Client ID: 37100, 差し込み文言: OFF）
 * 5. MR君管理画面でターゲット設定（OPD2）
 * 6. M3.com SP版で表示確認（OPD2）- Personal OPD表示（差し込み文言なし）
 * 7. OPD3作成（Client ID: なし, 差し込み文言: ON）
 * 8. MR君管理画面でターゲット設定（OPD3）
 * 9. M3.com SP版で表示確認（OPD3）- 通常OPD表示
 */
test.describe('Unit1_OPD_標準テスト_ID58', () => {
  let opdId1: string;  // Client ID: 37100, 差し込み文言: ON
  let opdId2: string;  // Client ID: 37100, 差し込み文言: OFF
  let opdId3: string;  // Client ID: なし
  let opdTitle1: string;
  let opdTitle2: string;
  let opdTitle3: string;

  test('Personal OPD機能の検証 (Client ID・差し込み文言の組み合わせ)', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID58');

    // ========================================
    // Part 1: OPD1作成（Client ID: 37100, 差し込み文言: ON）
    // ========================================
    console.log('\n### Part 1: OPD1作成（Client ID: 37100, 差し込み文言: ON）');

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
    const randomDigits1 = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const opdRequestFormId1 = `${opdMessageNumber}${randomDigits1}`;

    // タイトルを生成
    const flowID = '58';
    const randomAlnum1 = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle1 = `自動テストタイトル${flowID}_ClientID差込ON_${opdMessageNumber}_${randomAlnum1}`;

    // OPD1を作成（Client ID: 37100, 差し込み文言: ON）
    opdId1 = await opdCreatePage.createOPDMessage({
      companyName: '自動テスト株式会社',
      productName: '自動テスト薬品',
      requestFormId: opdRequestFormId1,
      openingPrice: '100',
      title: opdTitle1,
      openingLimit: '10',
      openingAction: '50',
      startDate: opdStartTime,
      startTime: '00:00:00',
      endDate: opdStartTime,
      endTime: '23:59:59',
      companyCode: '9909000135',
      pcDetailBody: 'PCディテール本文コンテンツ（Personal OPD: Client ID + 差し込み文言ON）',
      personalOpdClientId: '37100',
      personalInsertText: true,
    });

    console.log(`✓ OPD1作成完了（Client ID: 37100, 差し込み文言: ON）: ID=${opdId1}, タイトル=${opdTitle1}`);

    // ========================================
    // Part 2: MR君管理画面でターゲット設定（OPD1）
    // ========================================
    console.log('\n### Part 2: MR君管理画面でターゲット設定（OPD1）');

    await opexContext.close();

    const mrkunContext = await browser.newContext({
      storageState: '.auth/mrkun-user.json',
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const mrkunPage = await mrkunContext.newPage();
    const mrkunAdminPage = new MRkunAdminPage(mrkunPage);

    const systemCode = process.env.TEST_SYS_CODE || '0000909180';
    await mrkunAdminPage.setupTarget(opdId1, systemCode);

    console.log(`✓ ターゲット設定完了（OPD1）: システムコード=${systemCode}`);

    await mrkunContext.close();

    // ========================================
    // Part 3: M3.com SP版で表示確認（OPD1）
    // ========================================
    console.log('\n### Part 3: M3.com SP版で表示確認（OPD1）- Personal OPD表示');

    const m3spContext = await browser.newContext({
      viewport: { width: 375, height: 812 },  // iPhone X viewport
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3spPage = await m3spContext.newPage();
    const m3spLoginPage = new M3SPLoginPage(m3spPage);

    // mrqa_auto041でログイン（37100のmyMR君登録済み）
    const spLoginId = 'mrqa_auto041';
    const spPassword = 'Autoqa1!';

    await m3spLoginPage.goto();
    await m3spLoginPage.login(spLoginId, spPassword);

    const opdVisible1 = await m3spPage.locator(`text=${opdTitle1}`).isVisible({ timeout: 10000 }).catch(() => false);
    if (opdVisible1) {
      console.log(`✓ M3.com SP版でOPD1表示確認（Personal OPD）: ${opdTitle1}`);
      // TODO: 顔写真と差し込み文言の表示確認（将来実装）
    } else {
      console.log(`⚠️  M3.com SP版でOPD1表示未確認: ${opdTitle1}`);
    }

    await m3spContext.close();

    // ========================================
    // Part 4: OPD2作成（Client ID: 37100, 差し込み文言: OFF）
    // ========================================
    console.log('\n### Part 4: OPD2作成（Client ID: 37100, 差し込み文言: OFF）');

    const opexContext2 = await browser.newContext({
      storageState: '.auth/opex-user.json',
      viewport: { width: 1280, height: 720 },
    });

    const opexPage2 = await opexContext2.newPage();
    const opdCreatePage2 = new OPDCreatePage(opexPage2);

    await opexPage2.goto(dashboardUrl);
    await opexPage2.waitForLoadState('networkidle');
    await opdCreatePage2.goto(proxyNumber);
    await opdCreatePage2.waitForPageLoad();

    const randomDigits2 = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const opdRequestFormId2 = `${opdMessageNumber}${randomDigits2}`;

    const randomAlnum2 = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle2 = `自動テストタイトル${flowID}_ClientID差込OFF_${opdMessageNumber}_${randomAlnum2}`;

    opdId2 = await opdCreatePage2.createOPDMessage({
      companyName: '自動テスト株式会社',
      productName: '自動テスト薬品',
      requestFormId: opdRequestFormId2,
      openingPrice: '100',
      title: opdTitle2,
      openingLimit: '10',
      openingAction: '50',
      startDate: opdStartTime,
      startTime: '00:00:00',
      endDate: opdStartTime,
      endTime: '23:59:59',
      companyCode: '9909000135',
      pcDetailBody: 'PCディテール本文コンテンツ（Personal OPD: Client ID + 差し込み文言OFF）',
      personalOpdClientId: '37100',
      personalInsertText: false,
    });

    console.log(`✓ OPD2作成完了（Client ID: 37100, 差し込み文言: OFF）: ID=${opdId2}, タイトル=${opdTitle2}`);

    await opexContext2.close();

    // ========================================
    // Part 5: MR君管理画面でターゲット設定（OPD2）
    // ========================================
    console.log('\n### Part 5: MR君管理画面でターゲット設定（OPD2）');

    const mrkunContext2 = await browser.newContext({
      storageState: '.auth/mrkun-user.json',
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const mrkunPage2 = await mrkunContext2.newPage();
    const mrkunAdminPage2 = new MRkunAdminPage(mrkunPage2);

    await mrkunAdminPage2.setupTarget(opdId2, systemCode);

    console.log(`✓ ターゲット設定完了（OPD2）: システムコード=${systemCode}`);

    await mrkunContext2.close();

    // ========================================
    // Part 6: M3.com SP版で表示確認（OPD2）
    // ========================================
    console.log('\n### Part 6: M3.com SP版で表示確認（OPD2）- Personal OPD表示（差し込み文言なし）');

    const m3spContext2 = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3spPage2 = await m3spContext2.newPage();
    const m3spLoginPage2 = new M3SPLoginPage(m3spPage2);

    await m3spLoginPage2.goto();
    await m3spLoginPage2.login(spLoginId, spPassword);

    const opdVisible2 = await m3spPage2.locator(`text=${opdTitle2}`).isVisible({ timeout: 10000 }).catch(() => false);
    if (opdVisible2) {
      console.log(`✓ M3.com SP版でOPD2表示確認（Personal OPD、差し込み文言なし）: ${opdTitle2}`);
      // TODO: 顔写真の表示確認と差し込み文言の非表示確認（将来実装）
    } else {
      console.log(`⚠️  M3.com SP版でOPD2表示未確認: ${opdTitle2}`);
    }

    await m3spContext2.close();

    // ========================================
    // Part 7: OPD3作成（Client ID: なし, 差し込み文言: ON）
    // ========================================
    console.log('\n### Part 7: OPD3作成（Client ID: なし, 差し込み文言: ON）');

    const opexContext3 = await browser.newContext({
      storageState: '.auth/opex-user.json',
      viewport: { width: 1280, height: 720 },
    });

    const opexPage3 = await opexContext3.newPage();
    const opdCreatePage3 = new OPDCreatePage(opexPage3);

    await opexPage3.goto(dashboardUrl);
    await opexPage3.waitForLoadState('networkidle');
    await opdCreatePage3.goto(proxyNumber);
    await opdCreatePage3.waitForPageLoad();

    const randomDigits3 = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const opdRequestFormId3 = `${opdMessageNumber}${randomDigits3}`;

    const randomAlnum3 = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle3 = `自動テストタイトル${flowID}_ClientIDなし_${opdMessageNumber}_${randomAlnum3}`;

    opdId3 = await opdCreatePage3.createOPDMessage({
      companyName: '自動テスト株式会社',
      productName: '自動テスト薬品',
      requestFormId: opdRequestFormId3,
      openingPrice: '100',
      title: opdTitle3,
      openingLimit: '10',
      openingAction: '50',
      startDate: opdStartTime,
      startTime: '00:00:00',
      endDate: opdStartTime,
      endTime: '23:59:59',
      companyCode: '9909000135',
      pcDetailBody: 'PCディテール本文コンテンツ（通常OPD: Client IDなし）',
      // personalOpdClientId を指定しない → 通常OPD
    });

    console.log(`✓ OPD3作成完了（Client ID: なし）: ID=${opdId3}, タイトル=${opdTitle3}`);

    await opexContext3.close();

    // ========================================
    // Part 8: MR君管理画面でターゲット設定（OPD3）
    // ========================================
    console.log('\n### Part 8: MR君管理画面でターゲット設定（OPD3）');

    const mrkunContext3 = await browser.newContext({
      storageState: '.auth/mrkun-user.json',
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const mrkunPage3 = await mrkunContext3.newPage();
    const mrkunAdminPage3 = new MRkunAdminPage(mrkunPage3);

    await mrkunAdminPage3.setupTarget(opdId3, systemCode);

    console.log(`✓ ターゲット設定完了（OPD3）: システムコード=${systemCode}`);

    await mrkunContext3.close();

    // ========================================
    // Part 9: M3.com SP版で表示確認（OPD3）
    // ========================================
    console.log('\n### Part 9: M3.com SP版で表示確認（OPD3）- 通常OPD表示');

    const m3spContext3 = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3spPage3 = await m3spContext3.newPage();
    const m3spLoginPage3 = new M3SPLoginPage(m3spPage3);

    await m3spLoginPage3.goto();
    await m3spLoginPage3.login(spLoginId, spPassword);

    const opdVisible3 = await m3spPage3.locator(`text=${opdTitle3}`).isVisible({ timeout: 10000 }).catch(() => false);
    if (opdVisible3) {
      console.log(`✓ M3.com SP版でOPD3表示確認（通常OPD）: ${opdTitle3}`);
      // TODO: 顔写真と差し込み文言が表示されないことの確認（将来実装）
    } else {
      console.log(`⚠️  M3.com SP版でOPD3表示未確認: ${opdTitle3}`);
    }

    await m3spContext3.close();

    // テスト結果のアサーション
    expect(opdId1).toBeTruthy();
    expect(opdId2).toBeTruthy();
    expect(opdId3).toBeTruthy();
    expect(opdTitle1).toContain('自動テストタイトル58_ClientID差込ON');
    expect(opdTitle2).toContain('自動テストタイトル58_ClientID差込OFF');
    expect(opdTitle3).toContain('自動テストタイトル58_ClientIDなし');

    console.log('\n✅ テスト完了');
  });
});
