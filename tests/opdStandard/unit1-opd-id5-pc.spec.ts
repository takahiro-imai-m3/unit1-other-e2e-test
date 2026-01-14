import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { MrkunAdminOpdListPage } from '../../pages/mrkunAdmin/MrkunAdminOpdListPage';
import { QAToolPage } from '../../pages/mrkunAdmin/QAToolPage';
import { M3PCLoginPage } from '../../pages/dr/M3PCLoginPage';
import { M3PCMessageListPage } from '../../pages/dr/M3PCMessageListPage';
import { M3PCMessageDetailPage } from '../../pages/dr/M3PCMessageDetailPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID5 (PC版)
 *
 * テスト目的:
 * - メッセージ一覧、詳細にメッセージ情報（タイトル、クライアント名、顔写真、進呈アクション数など)が正しく表示されること
 * - 開封数がカウントアップされないこと（未開封時）
 * - 開封数がカウントアップされること（開封後）
 * - 開封前は設定された開封アクション数が加算されないこと
 * - 開封後は設定された開封アクション数が加算されること
 *
 * テスト対象ID:
 * - ID1: 課金対象者となる会員で新規作成したメッセージが一覧に表示されること
 * - ID5: メッセージ一覧にメッセージ情報（タイトル、クライアント名、顔写真、進呈アクション数など)が正しく表示されること
 * - ID6: メッセージ詳細にメッセージ情報（タイトル、クライアント名、顔写真、進呈アクション数など)が正しく表示されること
 * - ID23: 開封数がカウントアップされないこと（未開封時）
 * - ID24: 開封数がカウントアップされること（開封後）
 * - ID29/ID30: 開封前は設定された開封アクション数が加算されないこと / 開封後は設定された開封アクション数が加算されること
 *
 * 前提条件:
 * - Unit1_OPD_標準テスト_事前ID5_QA山本を実施済み
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - プロキシ経由でアクセス
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 *   - npx playwright test tests/setup/auth-opex.setup.ts --headed --project=setup
 *   - npx playwright test tests/setup/auth-mrkun.setup.ts --headed
 */
test.describe('Unit1_OPD_標準テスト_ID5 (PC版)', () => {
  let opdId: string;
  let opdTitle: string;
  let opdStartTime: string;
  const companyName = '自動テスト株式会社';
  const openingAction = 50; // 開封アクション数

  test('メッセージ一覧・詳細表示、開封アクション確認', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID5 (PC版)');

    // 共通変数
    const appUrl = process.env.BASE_URL || 'https://opex-qa1.unit1.qa-a.m3internal.com';
    const dashboardUrl = `${appUrl}/internal/dashboard`;
    const proxyNumber = '-qa1';
    const today = new Date();
    const dateStr = generateDateString('YYYY/MM/DD', 0);
    const dateNumStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');

    // ========================================
    // Part 0: 事前準備OPD作成（OPEX管理画面）
    // ========================================
    console.log('\n### Part 0: 事前準備OPD作成（管理メモ: opd_標準テスト_事前ID5_QA山本）');

    const opexContextPrep = await browser.newContext({
      storageState: '.auth/opex-user.json',
      viewport: { width: 1280, height: 720 },
    });

    const opexPagePrep = await opexContextPrep.newPage();
    const opdCreatePagePrep = new OPDCreatePage(opexPagePrep);

    // OPEX管理画面のダッシュボードに移動
    await opexPagePrep.goto(dashboardUrl);
    await opexPagePrep.waitForLoadState('networkidle');

    // OPD新規作成画面に遷移
    await opdCreatePagePrep.goto(proxyNumber);
    await opdCreatePagePrep.waitForPageLoad();

    // 依頼フォームIDを生成
    const requestFormIdPrep = `${dateNumStr}${Math.floor(Math.random() * 10000000)}`;

    // 事前準備OPD作成（管理メモ: opd_標準テスト_事前ID5_QA山本）
    const prepOpdId = await opdCreatePagePrep.createOPDMessage({
      companyName: '事前準備株式会社',
      productName: '事前準備薬品',
      requestFormId: requestFormIdPrep,
      openingPrice: '100',
      title: `事前準備OPD_ID5PC_${dateNumStr}`,
      openingLimit: '10',
      openingAction: '50',
      startDate: dateStr,
      startTime: '00:00:00',
      endDate: dateStr,
      endTime: '23:59:59',
      companyCode: '9909000135',
      pcDetailBody: 'QAツール事前準備用OPD',
      managementMemo: 'opd_標準テスト_事前ID5_QA山本', // QAツールが期待する管理メモ
    });

    console.log(`✓ 事前準備OPD作成完了: ID=${prepOpdId}, 管理メモ=opd_標準テスト_事前ID5_QA山本`);

    await opexContextPrep.close();

    // ========================================
    // Part 1: OPD作成（OPEX管理画面）
    // ========================================
    console.log('\n### Part 1: OPD作成（OPEX管理画面）');
    console.log('###メッセージを作成');

    const opexContext = await browser.newContext({
      storageState: '.auth/opex-user.json',
      viewport: { width: 1280, height: 720 },
    });

    const opexPage = await opexContext.newPage();
    const opdCreatePage = new OPDCreatePage(opexPage);

    // OPEX管理画面のダッシュボードに移動
    await opexPage.goto(dashboardUrl);
    await opexPage.waitForLoadState('networkidle');

    // OPD新規作成画面に遷移
    await opdCreatePage.goto(proxyNumber);
    await opdCreatePage.waitForPageLoad();

    // 日付を設定
    opdStartTime = dateStr;

    // 依頼フォームIDを生成
    const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const opdRequestFormId = `${dateNumStr}${randomDigits}`;

    // タイトルを生成
    const flowID = '5PC';
    const randomAlnum = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle = `自動テストタイトル${flowID}_${dateNumStr}_${randomAlnum}`;

    // OPDメッセージを作成
    opdId = await opdCreatePage.createOPDMessage({
      companyName: companyName,
      productName: '自動テスト薬品',
      requestFormId: opdRequestFormId,
      openingPrice: '100',
      title: opdTitle,
      openingLimit: '10',
      openingAction: openingAction.toString(),
      startDate: opdStartTime,
      startTime: '00:00:00',
      endDate: opdStartTime,
      endTime: '23:59:59',
      companyCode: '9909000135', // 課金対象会社コード
      pcDetailBody: 'PCディテール本文コンテンツ',
    });

    console.log(`✓ OPD作成完了: ID=${opdId}, タイトル=${opdTitle}`);
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

    // システムコード901468でターゲット設定（QA山本医師 - mrqa_auto046）
    const systemCode = '901468';
    await mrkunAdminPage.setupTarget(opdId, systemCode);
    console.log(`✓ ターゲット設定完了: システムコード=${systemCode}`);

    // ターゲット設定の反映待機
    console.log('⏳ ターゲット設定の反映待機中...');
    await mrkunPage.waitForTimeout(10000);
    console.log('✓ 10秒待機完了');

    // ========================================
    // Part 3: QA用ツールでCA設定（OPD確率予測モデル登録）
    // ========================================
    console.log('\n### Part 3: QA用ツールでCA設定');

    const qaToolPage = new QAToolPage(mrkunPage);

    // OPD確率予測モデル登録（CA設定）
    const registered = await qaToolPage.registerOpdAlgorithmType(systemCode);

    if (!registered) {
      console.log('⚠️  CA設定が完了していない可能性がありますが、テストを継続します');
    }

    await mrkunContext.close();

    // ========================================
    // Part 4: ID23 - 開封数がカウントアップされないこと（未開封時）
    // ========================================
    console.log('\n### Part 4: ID23 - 開封数がカウントアップされないこと（未開封時）');

    const mrkunContext2 = await browser.newContext({
      storageState: '.auth/mrkun-user.json',
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const mrkunPage2 = await mrkunContext2.newPage();
    const mrkunOpdListPage = new MrkunAdminOpdListPage(mrkunPage2);
    await mrkunOpdListPage.gotoOpdDetailByOpdId(opdId);

    // 開封数が0であることを確認
    const unopenedCount = await mrkunOpdListPage.getOpenedCount();
    expect(unopenedCount.total).toBe(0);
    expect(unopenedCount.charged).toBe(0);
    console.log(`✓ ID23確認完了: 開封数=${unopenedCount.total}, うち課金=${unopenedCount.charged}`);

    await mrkunContext2.close();

    // ========================================
    // Part 5: ID1, ID5 - メッセージ一覧での表示確認
    // ========================================
    console.log('\n### Part 5: ID1, ID5 - メッセージ一覧での表示確認');
    console.log('###ID1_課金対象者となる会員で新規作成したメッセージが一覧に表示されること');
    console.log('###ID5_メッセージ一覧にメッセージ情報（タイトル、クライアント名、顔写真、進呈アクション数など)が正しく表示されること');

    const m3pcContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3pcPage = await m3pcContext.newPage();
    const m3pcLoginPage = new M3PCLoginPage(m3pcPage);
    const m3pcMessageListPage = new M3PCMessageListPage(m3pcPage);

    // M3.comにログイン
    const loginId = process.env.M3_PC_LOGIN_ID || 'mrqa_auto046';
    const password = process.env.M3_PC_PASSWORD || 'Autoqa1!';

    console.log('###m3.comにログイン');
    await m3pcLoginPage.loginToM3(loginId, password);

    // メッセージ一覧ページに遷移
    await m3pcMessageListPage.goto();

    // メッセージ一覧での表示確認（ID1, ID5）
    await m3pcMessageListPage.verifyMessageInfo(
      opdTitle,
      companyName,
      opdStartTime,
      50 // 最小アクション数
    );

    // ========================================
    // Part 6: ID30/ID29 - 開封後のアクション数加算確認
    // ========================================
    console.log('\n### Part 6: ID30/ID29 - 開封後のアクション数加算確認');

    // 開封前のアクションポイントを取得
    const actionBeforeOpen = await m3pcMessageListPage.getCurrentActionPoints();
    const expectedActionAfterOpen = actionBeforeOpen + openingAction;

    // メッセージ詳細ページに遷移（開封）
    const m3pcMessageDetailPage = new M3PCMessageDetailPage(m3pcPage);
    await m3pcMessageDetailPage.goto(opdId);

    // 開封後のアクションポイントを確認
    await m3pcMessageDetailPage.verifyMinimumActionPoints(expectedActionAfterOpen);
    console.log(`✓ ID30/ID29確認完了: 開封前=${actionBeforeOpen}, 開封後=${expectedActionAfterOpen}`);

    // ========================================
    // Part 7: ID6 - メッセージ詳細での表示確認
    // ========================================
    console.log('\n### Part 7: ID6 - メッセージ詳細での表示確認');
    console.log('###ID6_メッセージ詳細にメッセージ情報（タイトル、クライアント名、顔写真、進呈アクション数など)が正しく表示されること');

    await m3pcMessageDetailPage.verifyMessageDetailInfo(
      'ワンポイント医療情報',
      opdTitle,
      companyName,
      'https://mrkun.m3.com/mt-img/onepoint/'
    );

    await m3pcContext.close();

    // ========================================
    // Part 8: ID24 - 開封数がカウントアップされること（開封後）
    // ========================================
    console.log('\n### Part 8: ID24 - 開封数がカウントアップされること（開封後）');

    const mrkunContext3 = await browser.newContext({
      storageState: '.auth/mrkun-user.json',
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const mrkunPage3 = await mrkunContext3.newPage();
    const mrkunOpdListPage2 = new MrkunAdminOpdListPage(mrkunPage3);
    await mrkunOpdListPage2.gotoOpdDetailByOpdId(opdId);

    // 開封数が1であることを確認
    const openedCount = await mrkunOpdListPage2.getOpenedCount();
    expect(openedCount.total).toBe(1);
    expect(openedCount.charged).toBe(1);
    console.log(`✓ ID24確認完了: 開封数=${openedCount.total}, うち課金=${openedCount.charged}`);

    await mrkunContext3.close();

    console.log('\n✅ テスト完了');
    console.log(`OPD ID: ${opdId}`);
    console.log(`OPD Title: ${opdTitle}`);
  });
});
