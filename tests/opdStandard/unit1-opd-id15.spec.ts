import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { M3PCLoginPage } from '../../pages/dr/M3PCLoginPage';
import { M3PCMessageDetailPage } from '../../pages/dr/M3PCMessageDetailPage';

/**
 * Unit1_OPD_標準テスト_ID15
 *
 * テスト対象ID: ID15, ID18, ID31, ID34
 *
 * ■条件
 * - コンテンツ種別: 動画、その他
 * - アクション: なし（開封アクション0、コンテンツアクション0）
 * - MR登録: なし（MR_IDは設定するが登録されない）
 *
 * ■期待値
 * - 動画、その他コンテンツを視聴することができ、視聴時にアクションが進呈されず、MR登録はされないこと（ID15, ID18）
 * - 開封後も開封アクションが加算されないこと（ID31）
 * - クリック後もコンテンツのアクションが加算されないこと（ID34）
 *
 * ■テストフロー
 * 1. OPEX管理画面でOPD作成（埋め込み動画、その他コンテンツ設定、アクション0）
 * 2. MR君管理画面でターゲット設定（システムコード: 901490）
 * 3. OPD編集画面で開封アクション・コンテンツアクションをすべて0に設定
 * 4. 動画ファイルアップロード（JW Player）
 * 5. M3.comログイン（mrqa_auto049）
 * 6. ID31: 開封後も開封アクションが加算されないこと確認
 * 7. ID15, ID18, ID34: 動画・その他コンテンツ視聴時にアクションが加算されないこと確認
 * 8. MR登録されていないこと確認
 */

test.describe('Unit1_OPD_標準テスト_ID15', () => {
  test('ID15, ID18, ID31, ID34 - アクションなし・MR登録なしテスト', async ({ page, browser }) => {
    // システムコード901490でターゲット設定（mrqa_auto049）
    const systemCode = '901490';
    const loginId = 'mrqa_auto049';
    const password = process.env.M3_PC_PASSWORD || 'Autoqa1!';

    console.log('\n=== Unit1_OPD_標準テスト_ID15 開始 ===');
    console.log(`システムコード: ${systemCode}`);
    console.log(`ログインID: ${loginId}`);

    // Part 1: OPEX管理画面でOPD作成
    console.log('\n### Part 1: OPEX管理画面でOPD作成');
    const opdCreatePage = new OPDCreatePage(page);

    // OPD作成画面に遷移（認証済みセッションを使用）
    await opdCreatePage.goto();
    await opdCreatePage.waitForPageLoad();

    // 基本情報を入力
    const today = new Date();
    const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    const opdMessageNumber = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    const opdMessageTitle = `自動テストタイトルID15_${opdMessageNumber}_${randomSuffix}`;
    const requestFormId = `${opdMessageNumber}${Math.floor(Math.random() * 10000000)}`;

    // 基本情報入力
    await opdCreatePage.fillBasicInfo({
      companyName: '自動テスト株式会社',
      productName: '自動テスト薬品',
      requestFormId: requestFormId,
      openingPrice: '100',
      title: opdMessageTitle,
      openingLimit: '10',
      openingAction: '50', // 後で0に変更
    });

    // 配信ステータス: 表示
    await opdCreatePage.deliveryStatusDisplayRadio.click();

    // 日時設定
    await opdCreatePage.setDateTime(true, dateStr, '00:00:00'); // 開始日時
    await opdCreatePage.setDateTime(false, dateStr, '23:59:59'); // 終了日時

    // 配信終了日
    await opdCreatePage.clickDeliveryEndDate();

    // 管理メモ
    await opdCreatePage.setManagementMemo(opdMessageTitle);

    // メッセージ種類: 通常OPD
    await opdCreatePage.messageTypeNormalOpdRadio.click();

    // 合算チェック用会社
    await opdCreatePage.selectBillingCompany('9909000135');

    // 埋め込み動画を利用する（PCもSPもワンタグ）
    await page.locator('#useEmbeddedMovie_doUseEmbeddedMoviePcSpOneTag > span.el-radio__label').click();

    // PCディテール本文
    await opdCreatePage.fillPCDetail('PCディテール本文コンテンツ');
    await opdCreatePage.copyPCDetailToSPDetail();

    // QFB100回答無償CP: 対象外
    await opdCreatePage.selectQfbReporting(false);

    // コンテンツ設定（アクションは後で0に変更）
    // 動画
    await opdCreatePage.addMovieContent('dellegra_201501_01', '5');

    // その他コンテンツ（4つ）
    await opdCreatePage.addOtherContent('https://www.m3.com', '5');
    await opdCreatePage.addOtherContent('https://www.yahoo.co.jp/', '5');
    await opdCreatePage.addOtherContent('https://www.google.com/intl/ja_jp/about/', '5');

    // OPD Quiz（後で0に）
    await opdCreatePage.addOpdQuizContent('https://mrkun.m3.com/mrq/contentsquiz/m3sMCD0001/1/quiz.htm', '5');

    // MR君・myMR君登録（後で0に）
    await opdCreatePage.addMrRegistrationContent('https://www.google.com/?hl=ja', '5');

    // 添付文書（後で0に）
    await opdCreatePage.addAttachmentContent('https://www.mhlw.go.jp/file/05-Shingikai-11121000-Iyakushokuhinkyoku-Soumuka/0000050568.pdf', '5');

    // OPD作成
    const opdId = await opdCreatePage.createOPD();
    console.log(`✓ OPD作成完了: ID=${opdId}`);

    // Part 2: MR君管理画面でターゲット設定
    console.log('\n### Part 2: MR君管理画面でターゲット設定');
    const mrkunPage = await browser.newPage();
    const mrkunAdminPage = new MRkunAdminPage(mrkunPage);
    await mrkunAdminPage.setupTarget(opdId, systemCode);
    console.log(`✓ ターゲット設定完了: システムコード=${systemCode}`);
    await mrkunPage.close();

    // Part 3: OPD編集画面でアクションをすべて0に設定
    console.log('\n### Part 3: OPD編集画面でアクションをすべて0に設定');
    await opdCreatePage.gotoEdit(opdId);

    // 開封アクションを0に
    await opdCreatePage.setOpeningAction('0');

    // MR_IDを設定（小松ゆう）
    await page.locator('.el-select').filter({ hasText: 'MR_IDを登録しない' }).click();
    await page.locator('span', { hasText: 'OPMIK | 小松ゆう(大塚製薬株式会社)' }).click();

    // 各コンテンツのアクションを0に
    // 動画（tr:nth-child(1)）
    await page.locator('div.el-table__body-wrapper.is-scrolling-left > table > tbody > tr:nth-child(1) > td.el-table_1_column_4.el-table__cell > div > div > input').fill('0');

    // その他1（tr:nth-child(2)）
    await page.locator('div.el-table__body-wrapper.is-scrolling-left > table > tbody > tr:nth-child(2) > td.el-table_1_column_4.el-table__cell > div > div > input').fill('0');

    // その他2（tr:nth-child(3)）
    await page.locator('div.el-table__body-wrapper.is-scrolling-left > table > tbody > tr:nth-child(3) > td.el-table_1_column_4.el-table__cell > div > div > input').fill('0');

    // その他3（tr:nth-child(4)）
    await page.locator('div.el-table__body-wrapper.is-scrolling-left > table > tbody > tr:nth-child(4) > td.el-table_1_column_4.el-table__cell > div > div > input').fill('0');

    // OPD Quiz（tr:nth-child(8)）
    await page.locator('div.el-table__body-wrapper.is-scrolling-left > table > tbody > tr:nth-child(8) > td.el-table_1_column_4.el-table__cell > div > div > input').fill('0');

    // MR君・myMR君登録（tr:nth-child(9)）
    await page.locator('div.el-table__body-wrapper.is-scrolling-left > table > tbody > tr:nth-child(9) > td.el-table_1_column_4.el-table__cell > div > div > input').fill('0');

    // 添付文書（tr:nth-child(10)）
    await page.locator('div.el-table__body-wrapper.is-scrolling-left > table > tbody > tr:nth-child(10) > td.el-table_1_column_4.el-table__cell > div > div > input').fill('0');

    // PCディテール本文を更新（embedded-movie divを含む）
    await opdCreatePage.fillPCDetail('');
    await opdCreatePage.fillPCDetail('動画コンテンツ <div id="embedded-movie"></div>');
    await opdCreatePage.copyPCDetailToSPDetail();

    // 更新ボタン
    await page.locator('button', { hasText: '更新' }).click();
    await page.waitForTimeout(3000);
    await page.locator('button', { hasText: 'OK' }).click();
    await page.waitForTimeout(5000);

    console.log(`✓ アクション設定を0に変更完了`);

    // Part 4: 動画ファイルアップロード
    console.log('\n### Part 4: 動画ファイルアップロード');
    await opdCreatePage.uploadMovieFile(opdId, 'short movie.mp4');
    console.log(`✓ 動画ファイルアップロード完了`);

    // Part 5: M3.comログイン
    console.log('\n### Part 5: M3.comログイン');
    const m3Page = await browser.newPage();
    const m3LoginPage = new M3PCLoginPage(m3Page);
    const m3DetailPage = new M3PCMessageDetailPage(m3Page);

    await m3LoginPage.goto();
    await m3LoginPage.login(loginId, password);
    console.log(`✓ M3.comログイン完了: ${loginId}`);

    // 開封前のアクションポイントを取得
    const actionBeforeOpen = await m3DetailPage.getCurrentActionPoints();
    console.log(`📊 開封前のアクションポイント: ${actionBeforeOpen}`);

    // Part 6: ID31 - 開封後も開封アクションが加算されないこと確認
    console.log('\n### Part 6: ID31 - 開封後も開封アクションが加算されないこと確認');
    await m3DetailPage.goto(opdId);
    await m3Page.waitForTimeout(20000); // 開封処理完了待機
    await m3Page.reload();

    const actionAfterOpen = await m3DetailPage.getCurrentActionPoints();
    console.log(`📊 開封後のアクションポイント: ${actionAfterOpen}`);

    // ステータスアップアクション（5pt）のみ加算されることを許容
    const actionDiff = actionAfterOpen - actionBeforeOpen;
    expect(actionDiff).toBeLessThanOrEqual(5);
    console.log(`✓ ID31確認: 開封アクションが加算されていない（差分: ${actionDiff}pt、期待: <=5pt）`);

    // Part 7: ID15, ID18, ID34 - コンテンツ視聴時にアクションが加算されないこと確認
    console.log('\n### Part 7: ID15, ID18, ID34 - コンテンツ視聴時にアクションが加算されないこと確認');

    // 視聴前のアクションポイント取得
    const actionBeforeView = await m3DetailPage.getCurrentActionPoints();
    console.log(`📊 コンテンツ視聴前のアクションポイント: ${actionBeforeView}`);

    // iframe内の動画コンテンツをクリック
    const iframe = m3Page.frameLocator('iframe.autoHeight');
    await iframe.locator('.jwplayer-overlay').click();
    await m3Page.waitForTimeout(5000);

    // その他コンテンツ1をクリック（新しいタブが開く）
    await iframe.locator('ul > li:nth-child(1) > a').click();
    await m3Page.waitForTimeout(3000);

    // 元のタブに戻る
    const pages = browser.contexts()[0].pages();
    if (pages.length > 2) {
      await pages[pages.length - 1].close(); // 最新のタブを閉じる
    }

    await m3Page.waitForTimeout(40000); // アクション反映待機
    await m3Page.reload();

    // アクション加算・変換履歴を確認
    await m3Page.goto('https://point-qa1.m3.com/action/history');
    const actionAfterView = await m3DetailPage.getCurrentActionPoints();
    console.log(`📊 コンテンツ視聴後のアクションポイント: ${actionAfterView}`);

    // ステータスアップアクション（5pt）のみ加算されることを許容
    const viewActionDiff = actionAfterView - actionBeforeView;
    expect(viewActionDiff).toBeLessThanOrEqual(5);
    console.log(`✓ ID15, ID18, ID34確認: コンテンツアクションが加算されていない（差分: ${viewActionDiff}pt、期待: <=5pt）`);

    // Part 8: MR登録されていないこと確認
    console.log('\n### Part 8: MR登録されていないこと確認');
    await m3Page.goto('https://mrkun.m3.com/mrq/mr/list.htm');
    await m3Page.waitForTimeout(3000);

    const mrListContent = await m3Page.locator('dl').innerText();
    expect(mrListContent).not.toContain('小松ゆう');
    console.log(`✓ MR登録なし確認: 「小松ゆう」が登録されていないことを確認`);

    await m3Page.close();

    console.log('\n=== Unit1_OPD_標準テスト_ID15 完了 ===');
  });
});
