import { test, expect } from '@playwright/test';
import { OPDCreatePage } from '../../pages/opex/OPDCreatePage';
import { MRkunAdminPage } from '../../pages/mrkunAdmin/MRkunAdminPage';
import { QAToolPage } from '../../pages/mrkunAdmin/QAToolPage';
import { M3SPLoginPage } from '../../pages/dr/M3SPLoginPage';

/**
 * Unit1_OPD_標準テスト_ID10_SP (SP版)
 *
 * テスト対象ID: ID10, ID11, ID12
 *
 * ■条件
 * - 確認箇所: CA (Content Advisor)
 * - CA: 開封促進CA
 * - CA: 回答促進CA
 * - QFB: 利用する（単一選択形式）
 *
 * ■期待値
 * - ID10: 各種CAにメッセージ情報（タイトル、クライアント名、顔写真、進呈アクション数など）が正しく表示されること
 * - ID11: 開封促進CAが正常に表示され、CAからメッセージ詳細へ正常に遷移できること
 * - ID12: 回答促進CAが正常に表示され、CAからメッセージ詳細へ正常に遷移できること
 *
 * ■テストフロー
 * 1. OPEX管理画面でOPD作成（QFB付き）
 * 2. MR君管理画面でターゲット設定（システムコード: 901910）
 * 3. QA用ツールでCA設定（OPD確率予測モデル登録）
 * 4. SP版M3.comログイン（mrqa_auto074）
 * 5. ID10, ID11: 開封促進CAが正常に表示され、メッセージ詳細へ遷移できることを確認
 * 6. ID12: 回答促進CAが正常に表示され、メッセージ詳細へ遷移できることを確認
 * 7. クリーンアップ（管理メモを空欄にする）
 */

test.describe('Unit1_OPD_標準テスト_ID10_SP (SP版)', () => {
  test('ID10, ID11, ID12 - CA表示確認テスト (SP版)', async ({ page, browser }) => {
    // システムコード901910でターゲット設定（mrqa_auto074）
    const systemCode = '901910';
    const loginId = 'mrqa_auto074';
    const password = process.env.M3_SP_PASSWORD || 'Autoqa1!';
    const managementMemo = 'opd_標準テスト_事前ID10SP';

    console.log('\\n=== Unit1_OPD_標準テスト_ID10_SP (SP版) 開始 ===');
    console.log(`システムコード: ${systemCode}`);
    console.log(`ログインID: ${loginId}`);
    console.log(`管理メモ: ${managementMemo}`);

    // Part 1: OPEX管理画面でOPD作成（QFB付き）
    console.log('\\n### Part 1: OPEX管理画面でOPD作成（QFB付き）');
    const opdCreatePage = new OPDCreatePage(page);

    // OPD作成画面に遷移（認証済みセッションを使用）
    await opdCreatePage.goto();
    await opdCreatePage.waitForPageLoad();

    // 基本情報を入力
    const today = new Date();
    const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    const opdMessageNumber = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    const opdMessageTitle = `自動テストタイトルID10_SP_${opdMessageNumber}_${randomSuffix}`;
    const requestFormId = `${opdMessageNumber}${Math.floor(Math.random() * 10000000)}`;

    // 基本情報入力
    await opdCreatePage.fillBasicInfo({
      companyName: '自動テスト株式会社',
      productName: '自動テスト薬品',
      requestFormId: requestFormId,
      openingPrice: '100',
      title: opdMessageTitle,
      openingLimit: '10',
      openingAction: '50',
    });

    // 配信ステータス: 表示
    await opdCreatePage.deliveryStatusDisplayRadio.click();

    // 日時設定
    await opdCreatePage.setDateTime(true, dateStr, '00:00:00'); // 開始日時
    await opdCreatePage.setDateTime(false, dateStr, '23:59:59'); // 終了日時

    // 配信終了日
    await opdCreatePage.clickDeliveryEndDate();

    // 管理メモ（QA用ツールが期待する特定の値）
    await opdCreatePage.setManagementMemo(managementMemo);

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

    // QFB利用設定
    await opdCreatePage.enableQfb({
      title: 'ID10_QFBテスト_SP',
      defaultEmail: `id10sptest${Date.now()}@mabl.com`, // 一時メールアドレス
      point: '5',
      deadline: `${dateStr} 23:59`,
      limitCount: '0',
      questionType: '1', // 単一選択
      questionContent: 'Q1質問内容',
      answer1: '回答A',
      answer2: '回答B',
      answer3: '回答C',
      noteTop: '注意書き(上)',
      noteBottom: '注意書き(下)',
      internalNote: '社内連絡',
    });

    // OPD作成
    const opdId = await opdCreatePage.createOPD();
    console.log(`✓ OPD作成完了: ID=${opdId}`);

    // Part 2: MR君管理画面でターゲット設定
    console.log('\\n### Part 2: MR君管理画面でターゲット設定');
    const mrkunPage = await browser.newPage();
    const mrkunAdminPage = new MRkunAdminPage(mrkunPage);
    await mrkunAdminPage.setupTarget(opdId, systemCode);
    console.log(`✓ ターゲット設定完了: システムコード=${systemCode}`);
    await mrkunPage.close();

    // Part 3: QA用ツールでCA設定（OPD確率予測モデル登録）
    // SP版ではsystemCd1パラメータを使用
    console.log('\\n### Part 3: QA用ツールでCA設定（OPD確率予測モデル登録）');
    await page.goto(`http://mrqa1/admin/qa/registerOpdAlgorithmType.jsp?systemCd1=${systemCode}`);
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('登録完了');
    console.log(`✓ CA設定完了: システムコード=${systemCode}`);

    // Part 4: SP版M3.comログイン
    console.log('\\n### Part 4: SP版M3.comログイン');
    const m3SpPage = await browser.newPage();
    const m3SpLoginPage = new M3SPLoginPage(m3SpPage);

    await m3SpPage.goto('https://sp.m3.com/');
    await m3SpPage.waitForTimeout(3000);
    await m3SpPage.locator('input[placeholder="ログインID"]').fill(loginId);
    await m3SpPage.locator('input[placeholder="パスワード"]').fill(password);
    await m3SpPage.locator('button', { hasText: 'ログイン' }).click();
    await m3SpPage.waitForTimeout(3000);
    console.log(`✓ SP版M3.comログイン完了: ${loginId}`);

    // Part 5: ID10, ID11 - 開封促進CA表示確認
    console.log('\\n### Part 5: ID10, ID11 - 開封促進CA表示確認');
    await m3SpPage.goto('https://sp.m3.com/');
    await m3SpPage.waitForTimeout(10000); // SP版は表示に時間がかかる

    // 「まだお読みでない医療情報があります」が表示されるまでリトライ（最大7回）
    let retries = 7;
    let caDisplayed = false;
    while (retries > 0) {
      const caElement = await m3SpPage.locator('a[href*="90113"]').first();
      const caCount = await m3SpPage.locator('a[href*="90113"]').count();

      if (caCount > 0) {
        const caText = await caElement.innerText();
        if (caText.includes('まだお読みでない医療情報があります')) {
          caDisplayed = true;
          break;
        }
      }
      console.log(`  ⏳ CA表示待機中... (残り${retries}回)`);
      await m3SpPage.reload();
      await m3SpPage.waitForTimeout(10000);
      retries--;
    }

    expect(caDisplayed).toBeTruthy();
    console.log('✓ ID10, ID11: 開封促進CAが表示された');

    // CA href属性に"90113"（開封促進CA）が含まれることを確認
    const caLink = await m3SpPage.locator('a[href*="90113"]').first();
    const caHref = await caLink.getAttribute('href');
    expect(caHref).toContain('90113');
    console.log('✓ ID10: CA href属性に"90113"（開封促進CA）が含まれる');

    // CAタイトルがOPDタイトルと一致することを確認
    const caSpan = await m3SpPage.locator('span', { hasText: opdMessageTitle }).first();
    const caTitle = await caSpan.innerText();
    expect(caTitle).toContain(opdMessageTitle);
    console.log(`✓ ID10: CAタイトルが一致 (${opdMessageTitle})`);

    // 「まだお読みでない医療情報があります」が表示されること確認
    const caDiv = await m3SpPage.locator('div', { hasText: 'まだお読みでない医療情報があります' }).first();
    const caDivText = await caDiv.innerText();
    expect(caDivText).toContain('まだお読みでない医療情報があります');
    console.log('✓ ID10: 「まだお読みでない医療情報があります」が表示されている');

    // 顔写真が表示されること確認
    const caImage = await m3SpPage.locator('img[src*="https://mrkun.m3.com/mt-img/onepoint/"]').first();
    const caImageSrc = await caImage.getAttribute('src');
    expect(caImageSrc).toContain('https://mrkun.m3.com/mt-img/onepoint/');
    console.log('✓ ID10: 顔写真が表示されている');

    // 進呈アクション数が表示されること確認（50進呈）
    const actionSpan = await m3SpPage.locator('span', { hasText: '進呈' }).first();
    const actionText = await actionSpan.innerText();
    expect(actionText).toContain('50進呈');
    console.log('✓ ID10: 進呈アクション数が表示されている（50進呈）');

    // CAをクリックしてOPD詳細ページに遷移
    await caLink.click();
    await m3SpPage.waitForTimeout(3000);

    // OPD詳細ページのタイトルが一致することを確認
    const opdDetailTitle = await m3SpPage.locator('h1', { hasText: opdMessageTitle }).first().innerText();
    expect(opdDetailTitle).toBe(opdMessageTitle);
    console.log('✓ ID11: CAからメッセージ詳細へ正常に遷移できた');

    // Part 6: ID12 - 回答促進CA表示確認
    console.log('\\n### Part 6: ID12 - 回答促進CA表示確認');
    await m3SpPage.goto('https://sp.m3.com/');
    await m3SpPage.waitForTimeout(2000);

    // CAが表示される特定メッセージに遷移
    await m3SpPage.goto('https://mrkun.m3.com/sp/mrq/MWB0000000/202306091824343676/message.htm?pageContext=sp_mrq3.0&mkep=msgList&wid=20230609185957570');
    await m3SpPage.waitForTimeout(3000);

    // iframeにスイッチ
    const iframe = m3SpPage.frameLocator('iframe.autoHeight');

    // CA href属性に"90213"（回答促進CA）が含まれることを確認
    const surveyLink = iframe.locator('a', { hasText: 'アンケートに回答する' }).first();
    const surveyHref = await surveyLink.getAttribute('href');
    expect(surveyHref).toContain('90213');
    console.log('✓ ID12: CA href属性に"90213"（回答促進CA）が含まれる');

    // 「アンケートに回答する」ボタンをクリック
    await surveyLink.click();
    await m3SpPage.waitForTimeout(5000);

    // 新しいタブに遷移（QFB回答ページ）
    const pages = m3SpPage.context().pages();
    const qfbPage = pages[pages.length - 1];
    await qfbPage.waitForLoadState('domcontentloaded');
    await qfbPage.waitForTimeout(3000);

    // QFBタイトルが"ID10_QFBテスト_SP"と一致することを確認
    const qfbTitle = await qfbPage.locator('span', { hasText: 'ID10_QFBテスト_SP' }).first().innerText();
    expect(qfbTitle).toBe('ID10_QFBテスト_SP');
    console.log('✓ ID12: QFBタイトルが一致（ID10_QFBテスト_SP）CAからメッセージ詳細へ正常に遷移できた');

    await qfbPage.close();
    await m3SpPage.close();

    // Part 7: クリーンアップ（管理メモを空欄にする）
    console.log('\\n### Part 7: クリーンアップ（管理メモを空欄にする）');
    await opdCreatePage.gotoEdit(opdId);
    await opdCreatePage.setManagementMemo('');
    await page.locator('button', { hasText: '更新' }).click();
    await page.waitForTimeout(3000);
    await page.locator('button', { hasText: 'OK' }).click();
    await page.waitForTimeout(3000);
    console.log('✓ 管理メモクリーンアップ完了');

    console.log('\\n=== Unit1_OPD_標準テスト_ID10_SP (SP版) 完了 ===');
  });
});
