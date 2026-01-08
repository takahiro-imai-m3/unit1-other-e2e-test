import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { OPDEditPage } from '../../pages/opex/OPDEditPage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { DrLoginPage } from '../../pages/dr/DrLoginPage';
import { M3PCOpdListPage } from '../../pages/dr/M3PCOpdListPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID46
 *
 * テスト目的:
 * - 開封上限設定の検証
 * - 開封上限前は一覧にも表示され、メッセージ詳細を表示することができること
 * - 開封上限後は一覧に表示されないこと
 * - 開封上限後に開封上限設定なしにすると一覧にも表示され、メッセージ詳細を表示することができること
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 *
 * このテストは以下を実行します:
 * 1. OPD作成（開封上限: 1）
 * 2. MR君管理画面でターゲット設定
 * 3. ユーザー1 (mrqa_auto216) でM3.comログイン → OPD開封
 * 4. ユーザー2 (mrqa_auto007) でM3.comログイン → OPD非表示確認（上限達成）
 * 5. OPD編集で開封上限を削除（設定なし）
 * 6. ユーザー2 (mrqa_auto007) でM3.comログイン → OPD表示確認
 */
test.describe('Unit1_OPD_標準テスト_ID46', () => {
  let opdId: string;
  let opdTitle: string;

  test('開封上限設定の検証 (上限1 → 上限達成 → 上限削除)', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID46');

    // ========================================
    // Part 1: OPD作成（開封上限: 1）
    // ========================================
    console.log('\n### Part 1: OPD作成（開封上限: 1）');

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
    const flowID = '46';
    const randomAlnum = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle = `自動テストタイトル${flowID}_${opdMessageNumber}_${randomAlnum}`;

    // OPDメッセージを作成（開封上限: 1）
    opdId = await opdCreatePage.createOPDMessage({
      companyName: '自動テスト株式会社',
      productName: '自動テスト薬品',
      requestFormId: opdRequestFormId,
      openingPrice: '100',
      title: opdTitle,
      openingLimit: '1',  // 開封上限: 1人
      openingAction: '50',
      startDate: opdStartTime,
      startTime: '00:00:00',
      endDate: opdStartTime,
      endTime: '23:59:59',
      companyCode: '9909000135',
      pcDetailBody: 'PCディテール本文コンテンツ（開封上限テスト）',
    });

    console.log(`✓ OPD作成完了（開封上限: 1）: ID=${opdId}, タイトル=${opdTitle}`);

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

    // ========================================
    // Part 3: ユーザー1 (mrqa_auto216) でOPD開封
    // ========================================
    console.log('\n### Part 3: ユーザー1 (mrqa_auto216) でOPD開封');

    const m3User1Context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3User1Page = await m3User1Context.newPage();
    const drLoginPage1 = new DrLoginPage(m3User1Page);
    const m3OpdListPage1 = new M3PCOpdListPage(m3User1Page);

    const user1LoginId = process.env.M3_PC_LOGIN_ID || 'mrqa_auto216';
    const user1Password = process.env.M3_PC_PASSWORD || 'Autoqa1!';

    await drLoginPage1.navigateToDrLogin();
    await drLoginPage1.login(user1LoginId, user1Password);
    await m3User1Page.waitForTimeout(3000);

    await m3OpdListPage1.goto();

    const opdVisibleUser1 = await m3OpdListPage1.hasOpdWithTitle(opdTitle);
    if (opdVisibleUser1) {
      console.log(`✓ ユーザー1でOPD表示確認（上限前）: ${opdTitle}`);

      // OPDを開封（クリック）
      await m3OpdListPage1.clickOpdByTitle(opdTitle);
      await m3User1Page.waitForTimeout(3000);

      console.log(`✓ ユーザー1でOPD開封完了 → 開封数: 1/1`);
    } else {
      console.log(`⚠️  ユーザー1でOPD表示未確認: ${opdTitle}`);
    }

    await m3User1Context.close();

    // ========================================
    // Part 4: ユーザー2 (mrqa_auto007) でOPD非表示確認
    // ========================================
    console.log('\n### Part 4: ユーザー2 (mrqa_auto007) でOPD非表示確認（上限達成）');

    const m3User2Context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3User2Page = await m3User2Context.newPage();
    const drLoginPage2 = new DrLoginPage(m3User2Page);
    const m3OpdListPage2 = new M3PCOpdListPage(m3User2Page);

    const user2LoginId = 'mrqa_auto007';
    const user2Password = 'Autoqa1!';

    await drLoginPage2.navigateToDrLogin();
    await drLoginPage2.login(user2LoginId, user2Password);
    await m3User2Page.waitForTimeout(3000);

    await m3OpdListPage2.goto();

    const opdVisibleUser2Before = await m3OpdListPage2.hasOpdWithTitle(opdTitle);
    if (!opdVisibleUser2Before) {
      console.log(`✓ ユーザー2でOPD非表示確認（上限達成）: ${opdTitle}`);
    } else {
      console.log(`⚠️  ユーザー2でOPDが表示されています（上限達成後なのに表示）: ${opdTitle}`);
    }

    await m3User2Context.close();

    // ========================================
    // Part 5: OPD編集で開封上限を削除
    // ========================================
    console.log('\n### Part 5: OPD編集で開封上限を削除');

    const opexContext2 = await browser.newContext({
      storageState: '.auth/opex-user.json',
      viewport: { width: 1280, height: 720 },
    });

    const opexPage2 = await opexContext2.newPage();
    const opdEditPage = new OPDEditPage(opexPage2);

    // 開封上限を削除（空にする）
    await opdEditPage.updateOpeningLimit(opdId, '', proxyNumber);

    console.log(`✓ OPD ${opdId} の開封上限を削除しました`);

    await opexContext2.close();

    // ========================================
    // Part 6: ユーザー2 (mrqa_auto007) でOPD表示確認
    // ========================================
    console.log('\n### Part 6: ユーザー2 (mrqa_auto007) でOPD表示確認（上限削除後）');

    const m3User2Context2 = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3User2Page2 = await m3User2Context2.newPage();
    const drLoginPage3 = new DrLoginPage(m3User2Page2);
    const m3OpdListPage3 = new M3PCOpdListPage(m3User2Page2);

    await drLoginPage3.navigateToDrLogin();
    await drLoginPage3.login(user2LoginId, user2Password);
    await m3User2Page2.waitForTimeout(3000);

    await m3OpdListPage3.goto();

    const opdVisibleUser2After = await m3OpdListPage3.hasOpdWithTitle(opdTitle);
    if (opdVisibleUser2After) {
      console.log(`✓ ユーザー2でOPD表示確認（上限削除後）: ${opdTitle}`);
    } else {
      console.log(`⚠️  ユーザー2でOPD表示未確認（上限削除後なのに非表示）: ${opdTitle}`);
    }

    await m3User2Context2.close();

    // テスト結果のアサーション
    expect(opdId).toBeTruthy();
    expect(opdTitle).toContain('自動テストタイトル46');
    expect(opdVisibleUser1).toBe(true);  // ユーザー1は上限前に表示されること
    expect(opdVisibleUser2Before).toBe(false);  // ユーザー2は上限達成後に非表示
    expect(opdVisibleUser2After).toBe(true);  // ユーザー2は上限削除後に表示

    console.log('\n✅ テスト完了');
  });
});
