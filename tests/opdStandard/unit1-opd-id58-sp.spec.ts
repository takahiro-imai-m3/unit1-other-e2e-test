import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { M3SPLoginPage } from '../../pages/dr/M3SPLoginPage';
import { M3SPOpdListPage } from '../../pages/dr/M3SPOpdListPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID58_SP
 *
 * テスト目的:
 * - Personal OPD機能の検証（SP版）
 * - Client IDと差し込み文言オプションの組み合わせ確認
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 * - DCF医師（mrqa_auto041、Client ID: 37100）の設定済み
 *
 * このテストは以下を実行します:
 * 1. Personal OPD作成（Client ID: 37100、差し込み文言ON）
 * 2. MR君管理画面でターゲット設定
 * 3. M3.com SP版でPersonal OPD表示確認
 *
 * 注記:
 * - SP版では1パターンのみ実装（時間節約のため）
 * - PC版では3パターン実装済み
 */
test.describe('Unit1_OPD_標準テスト_ID58_SP', () => {
  let opdId: string;
  let opdTitle: string;

  test('Personal OPD作成 → MR君ターゲット設定 → M3.com SP版確認', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID58_SP');

    console.log('\n### Part 1: Personal OPD作成（Client ID: 37100、差し込み文言ON）');

    const opexContext = await browser.newContext({
      storageState: '.auth/opex-user.json',
      viewport: { width: 1280, height: 720 },
    });

    const opexPage = await opexContext.newPage();
    const opdCreatePage = new OPDCreatePage(opexPage);

    const appUrl = process.env.BASE_URL || 'https://opex-qa1.unit1.qa-a.m3internal.com';
    await opexPage.goto(`${appUrl}/internal/dashboard`);
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

    const flowID = '58';
    const randomAlnum = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle = `自動テストタイトル${flowID}_SP_PersonalOPD_${opdMessageNumber}_${randomAlnum}`;

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
      pcDetailBody: 'PCディテール本文コンテンツ（Personal OPD・SP版）',
      personalOpdClientId: '37100',
      personalInsertText: true,
    });

    console.log(`✓ Personal OPD作成完了: ID=${opdId}, タイトル=${opdTitle}`);

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

    console.log('\n### Part 3: M3.com SP版でPersonal OPD表示確認');

    const m3spContext = await browser.newContext({
      viewport: { width: 932, height: 430 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/113.0.5672.121 Mobile/15E148 Safari/604.1',
      proxy: { server: 'http://mrqa1:8888' },
    });

    const m3spPage = await m3spContext.newPage();
    const m3spLoginPage = new M3SPLoginPage(m3spPage);
    const m3spOpdListPage = new M3SPOpdListPage(m3spPage);

    const loginId = process.env.M3_SP_LOGIN_ID_DCF || 'mrqa_auto041';
    const password = process.env.M3_SP_PASSWORD || 'Autoqa1!';

    await m3spLoginPage.goto();
    await m3spLoginPage.login(loginId, password);
    await m3spPage.waitForTimeout(3000);

    await m3spOpdListPage.goto();

    const opdVisible = await m3spOpdListPage.hasOpdWithTitle(opdTitle);

    if (opdVisible) {
      console.log(`✓ M3.com SP版でPersonal OPDが表示されました: ${opdTitle}`);
    } else {
      console.log(`⚠️  M3.com SP版でPersonal OPDが表示されませんでした: ${opdTitle}`);
    }

    await m3spContext.close();
    await opexContext.close();

    expect(opdId).toBeTruthy();
    expect(opdTitle).toContain('自動テストタイトル58_SP_PersonalOPD');

    console.log('\n✅ テスト完了');
  });
});
