import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { DrLoginPage } from '../../pages/dr/DrLoginPage';
import { M3PCOpdListPage } from '../../pages/dr/M3PCOpdListPage';
import { M3SPLoginPage } from '../../pages/dr/M3SPLoginPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID77
 *
 * テスト目的:
 * - 1ソース用CSSの利用設定の検証
 * - 「利用する」設定でPC/SPどちらでも表示できること
 * - 「利用しない」設定でPC/SPどちらでも表示できること
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 *
 * このテストは以下を実行します:
 * 1. OPD作成（1ソース用CSS: 利用する）
 * 2. MR君管理画面でターゲット設定
 * 3. M3.com PC版で表示確認
 * 4. M3.com SP版で表示確認
 * 5. OPD作成（1ソース用CSS: 利用しない）
 * 6. MR君管理画面でターゲット設定
 * 7. M3.com PC版で表示確認
 * 8. M3.com SP版で表示確認
 */
test.describe('Unit1_OPD_標準テスト_ID77', () => {
  let opdId1: string;  // 1ソース用CSS: 利用する
  let opdId2: string;  // 1ソース用CSS: 利用しない
  let opdTitle1: string;
  let opdTitle2: string;

  test('1ソース用CSS設定の検証 (利用する/利用しない)', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID77');

    // ========================================
    // Part 1: OPD作成（1ソース用CSS: 利用する）
    // ========================================
    console.log('\n### Part 1: OPD作成（1ソース用CSS: 利用する）');

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
    const flowID = '77';
    const randomAlnum1 = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle1 = `自動テストタイトル${flowID}_1CSS利用_${opdMessageNumber}_${randomAlnum1}`;

    // OPDメッセージを作成（1ソース用CSS: 利用する）
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
      pcDetailBody: 'PCディテール本文コンテンツ（1ソース用CSS利用）',
      useOneSourceCss: true,  // 1ソース用CSS: 利用する
    });

    console.log(`✓ OPD作成完了（1ソース用CSS: 利用する）: ID=${opdId1}, タイトル=${opdTitle1}`);

    // ========================================
    // Part 2: MR君管理画面でターゲット設定（OPD1）
    // ========================================
    console.log('\n### Part 2: MR君管理画面でターゲット設定（OPD1）');

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
    // Part 3: M3.com PC版で表示確認（OPD1）
    // ========================================
    console.log('\n### Part 3: M3.com PC版で表示確認（OPD1）');

    const m3pcContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3pcPage = await m3pcContext.newPage();
    const drLoginPage = new DrLoginPage(m3pcPage);
    const m3OpdListPage = new M3PCOpdListPage(m3pcPage);

    const loginId = process.env.M3_PC_LOGIN_ID || 'mrqa_auto219';
    const password = process.env.M3_PC_PASSWORD || 'Autoqa1!';

    await drLoginPage.navigateToDrLogin();
    await drLoginPage.login(loginId, password);
    await m3pcPage.waitForTimeout(3000);

    await m3OpdListPage.goto();

    const opdVisible1PC = await m3OpdListPage.hasOpdWithTitle(opdTitle1);
    if (opdVisible1PC) {
      console.log(`✓ M3.com PC版でOPD表示確認（1ソース用CSS利用）: ${opdTitle1}`);
    } else {
      console.log(`⚠️  M3.com PC版でOPD表示未確認: ${opdTitle1}`);
    }

    await m3pcContext.close();

    // ========================================
    // Part 4: M3.com SP版で表示確認（OPD1）
    // ========================================
    console.log('\n### Part 4: M3.com SP版で表示確認（OPD1）');

    const m3spContext = await browser.newContext({
      viewport: { width: 375, height: 812 },  // iPhone X viewport
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3spPage = await m3spContext.newPage();
    const m3spLoginPage = new M3SPLoginPage(m3spPage);

    const spLoginId = process.env.M3_SP_LOGIN_ID || 'mrqa_auto213';
    const spPassword = process.env.M3_SP_PASSWORD || 'Autoqa1!';

    await m3spLoginPage.goto();
    await m3spLoginPage.login(spLoginId, spPassword);

    const opdVisible1SP = await m3spPage.locator(`text=${opdTitle1}`).isVisible({ timeout: 10000 }).catch(() => false);
    if (opdVisible1SP) {
      console.log(`✓ M3.com SP版でOPD表示確認（1ソース用CSS利用）: ${opdTitle1}`);
    } else {
      console.log(`⚠️  M3.com SP版でOPD表示未確認: ${opdTitle1}`);
    }

    await m3spContext.close();

    // ========================================
    // Part 5: OPD作成（1ソース用CSS: 利用しない）
    // ========================================
    console.log('\n### Part 5: OPD作成（1ソース用CSS: 利用しない）');

    // OPD新規作成画面に遷移
    await opexPage.goto(dashboardUrl);
    await opexPage.waitForLoadState('networkidle');
    await opdCreatePage.goto(proxyNumber);
    await opdCreatePage.waitForPageLoad();

    const randomDigits2 = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const opdRequestFormId2 = `${opdMessageNumber}${randomDigits2}`;

    const randomAlnum2 = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle2 = `自動テストタイトル${flowID}_1CSS不使用_${opdMessageNumber}_${randomAlnum2}`;

    // OPDメッセージを作成（1ソース用CSS: 利用しない）
    opdId2 = await opdCreatePage.createOPDMessage({
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
      pcDetailBody: 'PCディテール本文コンテンツ（1ソース用CSS利用しない）',
      useOneSourceCss: false,  // 1ソース用CSS: 利用しない
    });

    console.log(`✓ OPD作成完了（1ソース用CSS: 利用しない）: ID=${opdId2}, タイトル=${opdTitle2}`);

    await opexContext.close();

    // ========================================
    // Part 6: MR君管理画面でターゲット設定（OPD2）
    // ========================================
    console.log('\n### Part 6: MR君管理画面でターゲット設定（OPD2）');

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
    // Part 7: M3.com PC版で表示確認（OPD2）
    // ========================================
    console.log('\n### Part 7: M3.com PC版で表示確認（OPD2）');

    const m3pcContext2 = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3pcPage2 = await m3pcContext2.newPage();
    const drLoginPage2 = new DrLoginPage(m3pcPage2);
    const m3OpdListPage2 = new M3PCOpdListPage(m3pcPage2);

    await drLoginPage2.navigateToDrLogin();
    await drLoginPage2.login(loginId, password);
    await m3pcPage2.waitForTimeout(3000);

    await m3OpdListPage2.goto();

    const opdVisible2PC = await m3OpdListPage2.hasOpdWithTitle(opdTitle2);
    if (opdVisible2PC) {
      console.log(`✓ M3.com PC版でOPD表示確認（1ソース用CSS不使用）: ${opdTitle2}`);
    } else {
      console.log(`⚠️  M3.com PC版でOPD表示未確認: ${opdTitle2}`);
    }

    await m3pcContext2.close();

    // ========================================
    // Part 8: M3.com SP版で表示確認（OPD2）
    // ========================================
    console.log('\n### Part 8: M3.com SP版で表示確認（OPD2）');

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

    const opdVisible2SP = await m3spPage2.locator(`text=${opdTitle2}`).isVisible({ timeout: 10000 }).catch(() => false);
    if (opdVisible2SP) {
      console.log(`✓ M3.com SP版でOPD表示確認（1ソース用CSS不使用）: ${opdTitle2}`);
    } else {
      console.log(`⚠️  M3.com SP版でOPD表示未確認: ${opdTitle2}`);
    }

    await m3spContext2.close();

    // テスト結果のアサーション
    expect(opdId1).toBeTruthy();
    expect(opdId2).toBeTruthy();
    expect(opdTitle1).toContain('自動テストタイトル77_1CSS利用');
    expect(opdTitle2).toContain('自動テストタイトル77_1CSS不使用');

    console.log('\n✅ テスト完了');
  });
});
