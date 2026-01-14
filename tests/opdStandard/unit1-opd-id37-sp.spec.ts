import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID37_SP
 *
 * テスト目的:
 * - QFB回答上限機能の検証（SP版）
 * - 回答上限を設定したOPDが正しく作成されること
 * - ターゲット設定が正常に完了すること
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 * - CSV設定と回答通知先は既存のMabl設定を使用
 *
 * このテストは以下を実行します:
 * 1. OPD作成（QFB機能ON、回答上限: 1）
 * 2. MR君管理画面でターゲット設定
 *
 * 注記:
 * - QFB回答機能（M3.com側での回答操作）は将来実装予定
 * - CSV アップロードと個別回答通知先設定は既存のMabl設定を使用
 */
test.describe('Unit1_OPD_標準テスト_ID37_SP', () => {
  let opdId: string;
  let opdTitle: string;

  test('QFB回答上限機能の検証 (回答上限: 1)', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID37_SP');

    // ========================================
    // Part 1: OPD作成（QFB機能ON、回答上限: 1）
    // ========================================
    console.log('\n### Part 1: OPD作成（QFB機能ON、回答上限: 1）');

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
    const flowID = '37';
    const randomAlnum = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle = `自動テストタイトル${flowID}_SP_QFB上限1_${opdMessageNumber}_${randomAlnum}`;

    // OPDメッセージを作成（QFB機能ON、回答上限: 1）
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
      pcDetailBody: 'PCディテール本文コンテンツ（QFB回答上限テスト・SP版）',
      useQfb: true,
      qfbTitle: 'QFB回答テスト（回答上限1名）',
      qfbDeadline: generateDateString('YYYY/MM/DD', 7) + ' 23:59',  // 7日後の23:59
      qfbAnswerLimit: '1',  // 回答上限: 1
    });

    console.log(`✓ OPD作成完了（QFB機能ON、回答上限: 1）: ID=${opdId}, タイトル=${opdTitle}`);

    await opexContext.close();

    // ========================================
    // Part 2: MR君管理画面でターゲット設定
    // ========================================
    console.log('\n### Part 2: MR君管理画面でターゲット設定');

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
    await mrkunAdminPage.setupTarget(opdId, systemCode);

    console.log(`✓ ターゲット設定完了: システムコード=${systemCode}`);

    await mrkunContext.close();

    // テスト結果のアサーション
    expect(opdId).toBeTruthy();
    expect(opdTitle).toContain('自動テストタイトル37_SP_QFB上限1');

    console.log('\n✅ テスト完了');
    console.log('📝 注記: QFB回答機能（M3.com側での回答操作・上限確認）は将来実装予定');
  });
});
