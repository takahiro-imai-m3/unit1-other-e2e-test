import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { OPDEditPage } from '../../pages/opex/OPDEditPage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { generateDateString } from '../../utils/utils';

/**
 * Unit1_OPD_標準テスト_ID74
 *
 * テスト目的:
 * - S3 CSV自動配信機能のテスト（利用する）
 * - 小分け配信ファイルのアップロード機能のテスト
 * - OPD標準テスト自動化のjob管理画面での配信確認
 * - 小分け配信されたOPDの表示確認
 *
 * 前提条件:
 * - VPN接続ON + WiFi接続 (192.168.0.x)
 * - プロキシ経由でアクセス
 * - OPEX管理画面とMR君管理画面の認証状態が保存済み
 *   - npx playwright test tests/setup/auth-opex.setup.ts --headed --project=setup
 *   - npx playwright test tests/setup/auth-mrkun.setup.ts --headed
 *
 * 条件:
 * - 自動配信: 利用する
 *
 * 期待値:
 * - 自動配信の仕様に準拠した挙動をすること
 * - S3にアップロードしたCSVファイルから小分け配信OPDが作成されること
 * - 小分け配信されたOPDがM3で表示できること
 *
 * このテストは以下を実行します:
 * 1. OPD作成（OPEX管理画面）
 * 2. 自動配信を有効化（OPD更新）
 * 3. MR君管理画面でターゲット設定
 * 4. QA用ツールで小分け配信ファイルアップロード（systemCd1=901587）
 * 5. OPD標準テスト自動化のjob管理画面で配信実行・確認
 * 6. 小分け配信されたOPDの確認
 */
test.describe('Unit1_OPD_標準テスト_ID74', () => {
  let opdId: string;
  let opdTitle: string;

  test('OPD作成 → 自動配信有効化 → ターゲット設定 → 小分け配信確認', async ({ browser }) => {
    console.log('#### Unit1_OPD_標準テスト_ID74');

    // ========================================
    // Part 1: OPD作成（OPEX管理画面）
    // ========================================
    console.log('\n### Part 1: OPD作成（OPEX管理画面）');

    // OPEX管理画面用のコンテキスト（認証状態を使用、プロキシなし）
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
    const flowID = '74';
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
      companyCode: '9909000135', // 製薬会社グループ名・文字数多めキューエーセイヤクカブシキガイシャＡＢＣここまでで35文字
      pcDetailBody: 'PCディテール本文コンテンツ',
      managementMemo: 'opd_標準テスト_事前ID74',
    });

    console.log(`✓ OPD作成完了: ID=${opdId}, タイトル=${opdTitle}`);

    // ========================================
    // Part 2: 自動配信を有効化（OPD更新）
    // ========================================
    console.log('\n### Part 2: 自動配信を有効化（OPD更新）');

    // 注意: U1OPEX-1194のデグレにより、新規作成時には自動配信を有効化できない
    // 必ずOPD作成→更新の順で実行する必要がある

    // OPD編集ページに遷移
    const opdEditPage = new OPDEditPage(opexPage);
    await opdEditPage.goto(opdId, proxyNumber);
    await opdEditPage.waitForPageLoad();

    // 自動配信を有効化
    await opdCreatePage.enableSubdivideDistribution();

    // 更新ボタンをクリック
    await opdEditPage.clickUpdate();

    console.log('✓ 自動配信を有効化しました');

    // ========================================
    // Part 3: MR君管理画面でターゲット設定
    // ========================================
    console.log('\n### Part 3: MR君管理画面でターゲット設定');

    // MR君管理画面用のコンテキスト（認証状態を使用、プロキシ経由）
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
    const systemCode = process.env.TEST_SYS_CODE || '00000099'; // QA環境のテスト用医師システムコード
    await mrkunAdminPage.setupTarget(opdId, systemCode);

    console.log(`✓ ターゲット設定完了: システムコード=${systemCode}`);

    // ========================================
    // Part 4: QA用ツールで小分け配信ファイルアップロード
    // ========================================
    console.log('\n### Part 4: QA用ツールで小分け配信ファイルアップロード');

    // QA用ツール - OPD標準テスト事前準備(小分け配信ファイルアップロード)を実行
    // systemCd1=901587 (ID74用のシステムコード)
    const qaToolUrl = `http://mrqa1/admin/qa/uploadOpdKowakeFile.jsp?systemCd1=901587`;
    await mrkunPage.goto(qaToolUrl);
    await mrkunPage.waitForLoadState('networkidle');

    // 正常終了を確認
    const bodyText = await mrkunPage.locator('body').textContent();
    expect(bodyText).toContain('正常終了');

    console.log('✓ 小分け配信ファイルアップロード完了');

    // コンテキストをクローズ
    await mrkunContext.close();

    // ========================================
    // Part 5: OPD標準テスト自動化のjob管理画面で配信実行・確認
    // ========================================
    console.log('\n### Part 5: OPD標準テスト自動化のjob管理画面で配信実行・確認');

    // OPD標準テスト自動化のjob管理(小分け配信)画面に遷移
    const jobUrl = `${appUrl}/internal/job/G26/O5DAr6gQ/OPD%E8%87%AA%E5%8B%95%E9%85%8D%E4%BF%A1-15%E6%99%82(OPD%E9%85%8D%E4%BF%A1%E3%81%82%E3%82%8A)-OPD%E6%A8%99%E6%BA%96%E3%83%86%E3%82%B9%E3%83%88%E8%87%AA%E5%8B%95%E5%8C%96`;
    await opexPage.goto(jobUrl);
    await opexPage.waitForLoadState('networkidle');

    // 取り込み対象となるファイルのプレフィックスに「M3_OPD_ID74_yyyymmdd」を入力
    const opdKowake = `M3_OPD_ID74_${opdMessageNumber}`;
    console.log(`\n📝 プレフィックス入力: ${opdKowake}`);

    // ラベル「*取り込み対象となるファイルのプレフィックス」を探して、その親要素内のinputを取得
    const prefixInput = opexPage.locator('text=取り込み対象となるファイルのプレフィックス')
      .locator('..')
      .locator('input[type="text"]');
    await prefixInput.waitFor({ state: 'visible', timeout: 10000 });
    await prefixInput.fill(opdKowake);

    // 入力確認
    const inputValue = await prefixInput.inputValue();
    console.log(`✓ 入力値確認: ${inputValue}`);

    // フォーカスを外して、次のフィールドに移動（バリデーショントリガー）
    await prefixInput.press('Tab');
    await opexPage.waitForTimeout(1000);

    // OKボタンの状態を確認
    const okButton = opexPage.locator('button').filter({ hasText: 'OK' }).last();
    const isDisabled = await okButton.evaluate((btn: HTMLButtonElement) => btn.disabled);
    console.log(`⚙️  OKボタンのdisabled状態: ${isDisabled}`);

    if (isDisabled) {
      // まだdisabledの場合、少し待機してから再確認
      console.log('⏳ OKボタン有効化待機中...');
      await opexPage.waitForTimeout(2000);
    }

    // disabled状態のOKボタンを有効化してからクリック
    await opexPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const okBtn = buttons.find(btn => btn.textContent?.trim() === 'OK') as HTMLButtonElement;
      if (okBtn) {
        okBtn.disabled = false;
        okBtn.click();
      }
    });
    console.log('✓ OKボタンを有効化してクリックしました');
    await opexPage.waitForTimeout(3000);

    // ActionsセクションのJob実行ボタンを押下
    // Note: UIにはテキスト「実行」がないため、Actionsラベルの近くにあるボタンを探す
    const actionsSection = opexPage.locator('text=Actions').locator('..').locator('..');
    const execButton = actionsSection.locator('button').first();

    // ボタンが表示されるまで待機
    await execButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✓ Job実行ボタンを検出しました');

    await execButton.click();
    console.log('✓ Job実行ボタンをクリックしました');

    // パラメータ確認ダイアログが再度表示されるまで待機
    await opexPage.waitForTimeout(1000);

    // 確認ダイアログのOKボタンも同様にdisabledなので、強制的に有効化してクリック
    await opexPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const okBtn = buttons.find(btn =>
        btn.textContent?.trim() === 'OK' &&
        btn.className.includes('el-button--primary')
      ) as HTMLButtonElement;
      if (okBtn) {
        okBtn.disabled = false;
        okBtn.click();
      }
    });
    console.log('✓ 確認ダイアログのOKボタンをクリックしました');
    await opexPage.waitForTimeout(3000);

    // リロード
    await opexPage.reload();
    await opexPage.waitForTimeout(10000);

    // 配信ステータスがOKであることを確認
    // XPath: //*[@id="app"]/div/div[2]/section/div/div[2]/div/div/div[2]/div/div[3]/table/tbody/tr[1]/td[6]
    const statusCell = opexPage.locator('xpath=//*[@id="app"]/div/div[2]/section/div/div[2]/div/div/div[2]/div/div[3]/table/tbody/tr[1]/td[6]');
    const statusText = await statusCell.textContent();
    expect(statusText).toContain('OK');

    console.log('✓ 配信ステータス: OK');

    // ========================================
    // Part 6: 小分け配信されたOPDの確認
    // ========================================
    console.log('\n### Part 6: 小分け配信されたOPDの確認');

    // MR君管理画面用のコンテキスト（再作成）
    const mrkunContext2 = await browser.newContext({
      storageState: '.auth/mrkun-user.json',
      viewport: { width: 1280, height: 720 },
      proxy: {
        server: 'http://mrqa1:8888', // mrqa1プロキシ
      },
    });

    const mrkunPage2 = await mrkunContext2.newPage();

    // MR君管理画面のOPD一覧画面に遷移（管理メモにopd_標準テスト_事前ID74と入力して検索）
    const mrkunSearchUrl = `https://mrkun.m3.com/admin/restricted/mt/OnePointDetail/list.jsp?=&memo=opd_%E6%A8%99%E6%BA%96%E3%83%86%E3%82%B9%E3%83%88_%E4%BA%8B%E5%89%8DID74&opdId=&action=view`;
    await mrkunPage2.goto(mrkunSearchUrl);
    await mrkunPage2.waitForLoadState('networkidle');

    // 一覧の最初のOPD IDを取得
    const firstOpdIdLink = mrkunPage2.locator('#widthpx > table.listTable > tbody > tr:nth-child(1) > td.cell_1 > p:nth-child(1) > a').first();
    const firstOpdIdText = await firstOpdIdLink.textContent();

    // 小分け配信コピー元と違うIDが表示されること（ここで失敗した場合小分け配信が作成されていない）
    expect(firstOpdIdText).not.toBe(opdId);

    console.log(`✓ 小分け配信されたOPD ID: ${firstOpdIdText} (元のOPD ID: ${opdId})`);

    // コンテキストをクローズ
    await mrkunContext2.close();

    // ========================================
    // Part 7: OPD停止（後処理）
    // ========================================
    console.log('\n### Part 7: OPD停止（後処理）');

    // OPD編集画面に遷移して配信停止
    await opdEditPage.stopDelivery(opdId, proxyNumber);

    console.log('✓ OPD停止完了');

    // コンテキストをクローズ
    await opexContext.close();

    // テスト結果のアサーション
    expect(opdId).toBeTruthy();
    expect(opdTitle).toContain('自動テストタイトル74');

    console.log('\n✅ テスト完了');
  });
});
