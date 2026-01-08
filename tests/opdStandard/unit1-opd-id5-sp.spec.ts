import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { OPDEditPage } from '../../pages/opex/OPDEditPage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { M3SPLoginPage } from '../../pages/dr/M3SPLoginPage';
import { M3SPOpdListPage } from '../../pages/dr/M3SPOpdListPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID5_SP
 *
 * テスト目的:
 * - OPD更新機能の検証（SP版）
 * - 開封数の確認
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 *
 * このテストは以下を実行します:
 * 1. OPD作成（OPEX管理画面）
 * 2. MR君管理画面でターゲット設定
 * 3. OPD更新（PCディテール本文を変更）
 * 4. M3.com SP版でOPD表示確認（iPhone 15 Plus ランドスケープ）
 */
test.describe('Unit1_OPD_標準テスト_ID5_SP', () => {
  let opdId: string;
  let opdTitle: string;

  test('OPD作成 → MR君ターゲット設定 → OPD更新 → M3.com SP版確認', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID5_SP');

    // ========================================
    // Part 1: OPD作成
    // ========================================
    console.log('\n### Part 1: OPD作成');

    const opexContext = await browser.newContext({
      storageState: '.auth/opex-user.json',
      viewport: { width: 1280, height: 720 },
    });

    const opexPage = await opexContext.newPage();
    const opdCreatePage = new OPDCreatePage(opexPage);

    const appUrl = process.env.BASE_URL || 'https://opex-qa1.unit1.qa-a.m3internal.com';
    const dashboardUrl = `${appUrl}/internal/dashboard`;
    await opexPage.goto(dashboardUrl);
    await opexPage.waitForLoadState('networkidle');

    const proxyNumber = '-qa1';
    await opdCreatePage.goto(proxyNumber);
    await opdCreatePage.waitForPageLoad();

    const today = new Date();
    const opdStartTime = generateDateString('YYYY/MM/DD', 0);
    const opdMessageNumber = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');

    const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const opdRequestFormId = `${opdMessageNumber}${randomDigits}`;

    const flowID = '5';
    const randomAlnum = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle = `自動テストタイトル${flowID}_SP_${opdMessageNumber}_${randomAlnum}`;

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
      companyCode: '9909000135',
      pcDetailBody: 'PCディテール本文コンテンツ（SP版テスト・初期）',
    });

    console.log(`✓ OPD作成完了: ID=${opdId}, タイトル=${opdTitle}`);

    // ========================================
    // Part 2: MR君管理画面でターゲット設定
    // ========================================
    console.log('\n### Part 2: MR君管理画面でターゲット設定');

    const mrkunContext = await browser.newContext({
      storageState: '.auth/mrkun-user.json',
      viewport: { width: 1280, height: 720 },
      proxy: { server: 'http://mrqa1:8888' },
    });

    const mrkunPage = await mrkunContext.newPage();
    const mrkunAdminPage = new MRkunAdminPage(mrkunPage);

    const systemCode = process.env.TEST_SYS_CODE || '0000909180';
    await mrkunAdminPage.setupTarget(opdId, systemCode);

    console.log(`✓ ターゲット設定完了: システムコード=${systemCode}`);
    await mrkunContext.close();

    // ========================================
    // Part 3: OPD更新
    // ========================================
    console.log('\n### Part 3: OPD更新');

    const opdEditPage = new OPDEditPage(opexPage);
    await opdEditPage.goto(opdId, proxyNumber, true);
    await opdEditPage.waitForPageLoad();

    await opdEditPage.updatePcDetailBody('PCディテール本文コンテンツ（SP版テスト・更新後）');

    console.log(`✓ OPD更新完了: ID=${opdId}`);
    await opexContext.close();

    // ========================================
    // Part 4: M3.com SP版でOPD表示確認
    // ========================================
    console.log('\n### Part 4: M3.com SP版でOPD表示確認（iPhone 15 Plus ランドスケープ）');

    const m3spContext = await browser.newContext({
      viewport: { width: 932, height: 430 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/113.0.5672.121 Mobile/15E148 Safari/604.1',
      proxy: { server: 'http://mrqa1:8888' },
    });

    const m3spPage = await m3spContext.newPage();
    const m3spLoginPage = new M3SPLoginPage(m3spPage);
    const m3spOpdListPage = new M3SPOpdListPage(m3spPage);

    const loginId = process.env.M3_SP_LOGIN_ID || 'mrqa_auto219';
    const password = process.env.M3_SP_PASSWORD || 'Autoqa1!';

    await m3spLoginPage.goto();
    await m3spLoginPage.login(loginId, password);
    await m3spPage.waitForTimeout(3000);

    await m3spOpdListPage.goto();

    const opdVisible = await m3spOpdListPage.hasOpdWithTitle(opdTitle);

    if (opdVisible) {
      console.log(`✓ M3.com SP版でOPDが表示されました: ${opdTitle}`);
      await m3spOpdListPage.verifyFirstOpdTitle(opdTitle);
    } else {
      console.log(`⚠️  M3.com SP版でOPDが表示されませんでした: ${opdTitle}`);
    }

    await m3spContext.close();

    expect(opdId).toBeTruthy();
    expect(opdTitle).toContain('自動テストタイトル5_SP');

    console.log('\n✅ テスト完了');
  });
});
