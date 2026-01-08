import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { OPDEditPage } from '../../pages/opex/OPDEditPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID5 - 簡易版
 * OPD作成とOPD更新のみをテスト
 */
test.describe('Unit1_OPD_標準テスト_ID5_簡易版', () => {
  let opdId: string;
  let opdTitle: string;

  test('OPD作成 → OPD更新', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID5 - 簡易版');

    // ========================================
    // Part 1: OPD作成（OPEX管理画面）
    // ========================================
    console.log('\n### Part 1: OPD作成（OPEX管理画面）');

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
    const flowID = '5';
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

    // ========================================
    // Part 2: OPDメッセージ更新
    // ========================================
    console.log('\n### Part 2: OPDメッセージ更新（PCディテール本文を変更）');

    const opdEditPage = new OPDEditPage(opexPage);

    // OPDメッセージを更新（PCディテール本文を"動画コンテンツ"に変更）
    await opdEditPage.updateOPDMessage(opdId, '動画コンテンツ', proxyNumber);

    console.log('✓ OPDメッセージ更新完了: PCディテール本文を"動画コンテンツ"に変更');

    // コンテキストをクローズ
    await opexContext.close();

    // テスト結果のアサーション
    expect(opdId).toBeTruthy();
    expect(opdTitle).toContain('自動テストタイトル5');

    console.log('\n✅ テスト完了');
  });
});
