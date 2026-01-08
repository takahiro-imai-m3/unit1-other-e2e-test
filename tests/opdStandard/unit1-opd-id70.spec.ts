import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID70
 *
 * テスト目的:
 * - ワンポイントMAの表示先確認
 * - ワンポイントMAとして、「MA君」で表示されること
 * - 「ワンポイント医療情報」で表示されないこと
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 *
 * このテストは以下を実行します:
 * 1. OPD作成（OPEX管理画面、ワンポイントMA有効）
 * 2. MR君管理画面でターゲット設定
 * 3. MA君で表示確認（将来実装）
 * 4. ワンポイント医療情報で非表示確認（将来実装）
 */
test.describe('Unit1_OPD_標準テスト_ID70', () => {
  let opdId: string;
  let opdTitle: string;

  test('OPD作成（ワンポイントMA有効） → MR君ターゲット設定', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID70');

    // ========================================
    // Part 1: OPD作成（OPEX管理画面、ワンポイントMA有効）
    // ========================================
    console.log('\n### Part 1: OPD作成（OPEX管理画面、ワンポイントMA有効）');

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
    const flowID = '70';
    const randomAlnum = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle = `自動テストタイトル${flowID}_${opdMessageNumber}_${randomAlnum}`;

    // OPDメッセージを作成（ワンポイントMA有効）
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
      useMedicalAffairs: true, // ワンポイントMAを有効化
    });

    console.log(`✓ OPD作成完了（ワンポイントMA有効）: ID=${opdId}, タイトル=${opdTitle}`);

    // コンテキストをクローズ
    await opexContext.close();

    // ========================================
    // Part 2: MR君管理画面でターゲット設定
    // ========================================
    console.log('\n### Part 2: MR君管理画面でターゲット設定');

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
    const systemCode = process.env.TEST_SYS_CODE || '00000099';
    await mrkunAdminPage.setupTarget(opdId, systemCode);

    console.log(`✓ ターゲット設定完了: システムコード=${systemCode}`);

    // コンテキストをクローズ
    await mrkunContext.close();

    // ========================================
    // Part 3: MA君で表示確認（将来実装）
    // ========================================
    console.log('\n### Part 3: MA君で表示確認（将来実装予定）');
    console.log('※ MA君のPage Objectが実装されていないため、この部分はスキップされます');

    // ========================================
    // Part 4: ワンポイント医療情報で非表示確認（将来実装）
    // ========================================
    console.log('\n### Part 4: ワンポイント医療情報で非表示確認（将来実装予定）');
    console.log('※ ワンポイント医療情報での非表示確認は将来実装予定です');

    // テスト結果のアサーション
    expect(opdId).toBeTruthy();
    expect(opdTitle).toContain('自動テストタイトル70');

    console.log('\n✅ テスト完了（MA君・ワンポイント医療情報の確認は未実装）');
  });
});
