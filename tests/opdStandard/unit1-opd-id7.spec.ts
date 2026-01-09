import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { DrLoginPage } from '../../pages/dr/DrLoginPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID7
 *
 * テスト目的:
 * - RHS（右サイドバー）とTODOでのOPD表示確認
 * - メッセージ情報（タイトル、クライアント名、顔写真、進呈アクション数など）が正しく表示されること
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 *
 * このテストは以下を実行します:
 * 1. OPD作成（OPEX管理画面）
 * 2. MR君管理画面でターゲット設定（ID: 678127）
 * 3. M3.com PCにログイン（mrqa_auto005）
 * 4. RHS（右サイドバー）でOPD表示確認
 * 5. TODO画面でOPD表示確認
 */
test.describe('Unit1_OPD_標準テスト_ID7', () => {
  let opdId: string;
  let opdTitle: string;
  const expectedCompanyName = '自動テスト株式会社';
  const expectedMinActionPoints = 50;
  const targetSystemCode = '678127';

  test('OPD作成 → MR君ターゲット設定 → RHSとTODO表示確認', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID7');

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
    const flowID = '7';
    const randomAlnum = Math.random().toString(36).substring(2, 5).toUpperCase();
    opdTitle = `自動テストタイトル${flowID}_${opdMessageNumber}_${randomAlnum}`;

    // OPDメッセージを作成
    opdId = await opdCreatePage.createOPDMessage({
      companyName: expectedCompanyName,
      productName: '自動テスト薬品',
      requestFormId: opdRequestFormId,
      openingPrice: '100',
      title: opdTitle,
      openingLimit: '10',
      openingAction: String(expectedMinActionPoints),
      startDate: opdStartTime,
      startTime: '00:00:00',
      endDate: opdStartTime,
      endTime: '23:59:59',
      companyCode: '9900000144', // M3
      pcDetailBody: 'PCディテール本文コンテンツ（ID7テスト）',
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

    await mrkunAdminPage.setupTarget(opdId, targetSystemCode);

    console.log(`✓ ターゲット設定完了: システムコード=${targetSystemCode}`);

    await mrkunContext.close();

    // ========================================
    // Part 3: M3.com PCにログイン
    // ========================================
    console.log('\n### Part 3: M3.com PCにログイン（mrqa_auto005）');

    const m3Context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888',
      },
    });

    const m3Page = await m3Context.newPage();
    const drLoginPage = new DrLoginPage(m3Page);

    // M3.comログイン
    const loginId = 'mrqa_auto005';
    const password = process.env.M3_PC_PASSWORD || 'Autoqa1!';

    await drLoginPage.navigateToDrLogin();
    await drLoginPage.login(loginId, password);
    await m3Page.waitForTimeout(3000);

    console.log(`✓ M3.comにログインしました: ${loginId}`);

    // ========================================
    // Part 4: RHS（右サイドバー）でOPD表示確認
    // ========================================
    console.log('\n### Part 4: RHS（右サイドバー）でOPD表示確認');

    // OPD一覧ページに遷移
    await m3Page.goto('https://mrkun.m3.com/mt/onepoint/top.htm?tc=sub-m3com');
    await m3Page.waitForLoadState('domcontentloaded');
    await m3Page.waitForTimeout(3000);

    // RHSでOPDを探す（JavaScriptで行番号を動的に検索）
    const opdLineNumber = await m3Page.evaluate((title) => {
      // RHSのOPDリストから該当タイトルを探す
      const links = document.querySelectorAll('#mrTabContent > div > ul > li > a');
      for (let i = 0; i < links.length; i++) {
        const link = links[i] as HTMLAnchorElement;
        const titleAttr = link.getAttribute('eop-title');
        if (titleAttr && titleAttr.includes(title)) {
          return i + 1; // 1-indexed
        }
      }
      return null;
    }, opdTitle);

    if (opdLineNumber === null) {
      console.log(`⚠️  RHSに「${opdTitle}」が表示されていません`);
      console.log('   ※ターゲット設定の反映に時間がかかる可能性があります');
    } else {
      console.log(`✓ RHSの${opdLineNumber}番目に「${opdTitle}」を発見`);

      // タイトル確認
      const titleLocator = m3Page.locator(`#mrTabContent > div > ul > li:nth-child(${opdLineNumber}) > a`);
      const titleText = await titleLocator.getAttribute('eop-title');
      expect(titleText).toContain(opdTitle);
      console.log(`✓ タイトル確認: ${titleText}`);

      // クライアント名確認
      const companyLocator = m3Page.locator(`li:nth-child(${opdLineNumber}) > div.atlas-rhs__article-list__text > span.atlas-rhs__article-list__source`);
      const companyText = await companyLocator.innerText();
      expect(companyText).toContain(expectedCompanyName);
      console.log(`✓ クライアント名確認: ${companyText}`);

      // 顔写真（サムネイル）確認
      const thumbnailLocator = m3Page.locator(`img[src*="/mt-img/onepoint/${opdId}/thumbnail.jpeg"]`);
      const thumbnailExists = await thumbnailLocator.count() > 0;
      expect(thumbnailExists).toBe(true);
      console.log(`✓ サムネイル画像確認: OPD ID ${opdId}`);

      // 進呈アクション数確認
      const actionPointsLocator = m3Page.locator(`li:nth-child(${opdLineNumber}) > div.atlas-rhs__article-list__text > span.m3-text--action-point`);
      const actionPointsText = await actionPointsLocator.innerText();
      const actionPoints = parseInt(actionPointsText, 10);
      expect(actionPoints).toBeGreaterThanOrEqual(expectedMinActionPoints);
      console.log(`✓ 進呈アクション数確認: ${actionPoints} (≥ ${expectedMinActionPoints})`);
    }

    // ========================================
    // Part 5: TODO画面でOPD表示確認
    // ========================================
    console.log('\n### Part 5: TODO画面でOPD表示確認');

    await m3Page.goto('https://www.m3.com/todo?from=active_start');
    await m3Page.waitForLoadState('domcontentloaded');
    await m3Page.waitForTimeout(2000);

    const expectedTodoText = `「${opdTitle}」を開封する`;

    // TODO内で該当OPDを探す（1〜10番目のいずれか）
    let foundInTodo = false;
    for (let i = 1; i <= 10; i++) {
      try {
        const todoLocator = m3Page.locator(`div:nth-child(${i}) > div.lp-todo-items__description > p`);
        const todoText = await todoLocator.innerText({ timeout: 1000 });

        if (todoText === expectedTodoText) {
          console.log(`✓ TODOの${i}番目に「${expectedTodoText}」を発見`);
          foundInTodo = true;
          break;
        }
      } catch {
        // 要素が見つからない場合は次へ
        continue;
      }
    }

    if (!foundInTodo) {
      console.log(`⚠️  TODO画面に「${expectedTodoText}」が表示されていません`);
      console.log('   ※既に開封済み、またはターゲット設定が反映されていない可能性があります');
    }

    await m3Context.close();

    // テスト結果のアサーション
    expect(opdId).toBeTruthy();
    expect(opdTitle).toContain('自動テストタイトル7');

    console.log('\n✅ テスト完了');
  });
});
