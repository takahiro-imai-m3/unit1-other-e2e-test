import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * グローバルセットアップ: 認証状態の自動チェック・リフレッシュ
 *
 * テスト実行前に自動的に実行され、認証が有効かチェックします。
 * 認証が切れている場合、既存のセッションを使って自動的に再ログインします。
 */

const OPEX_AUTH_FILE = path.join(__dirname, '.auth/opex-user.json');
const MRKUN_AUTH_FILE = path.join(__dirname, '.auth/mrkun-user.json');

/**
 * 認証ファイルの鮮度をチェック（作成から指定時間以内か）
 */
function isAuthFileFresh(authFile: string, maxAgeHours: number = 2): boolean {
  if (!fs.existsSync(authFile)) {
    return false;
  }

  const stats = fs.statSync(authFile);
  const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

  if (ageInHours <= maxAgeHours) {
    console.log(`✅ 認証ファイルは新しいです（${ageInHours.toFixed(1)}時間前に作成）`);
    return true;
  } else {
    console.log(`⚠️  認証ファイルが古くなっています（${ageInHours.toFixed(1)}時間前に作成）`);
    return false;
  }
}

/**
 * OPEX管理画面の認証をリフレッシュ
 */
async function refreshOpexAuth(): Promise<void> {
  console.log('\n🔄 OPEX管理画面の認証をリフレッシュしています...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-proxy-server'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // 既存の認証状態をロード（Cookieなどの一部は再利用できる可能性がある）
    ...(fs.existsSync(OPEX_AUTH_FILE) ? { storageState: OPEX_AUTH_FILE } : {}),
  });

  const page = await context.newPage();
  const loginUrl = 'https://opex-qa1.unit1.qa-a.m3internal.com/internal/dashboard';

  console.log('ℹ️  ブラウザでログインしてください...');
  console.log('   1. 「Continue with Google」をクリック');
  console.log('   2. M3のGoogleアカウントでログイン');
  console.log('   3. ダッシュボードが表示されるまで待機（自動検出）\n');

  await page.goto(loginUrl);

  // ダッシュボードのIDフィールドが表示されるまで待機（最大120秒）
  try {
    await page.waitForSelector('label:has-text("ID")', { timeout: 120000 });
    console.log('✅ ダッシュボード画面を検出しました');
  } catch (error) {
    console.log('⚠️  ダッシュボード画面を自動検出できませんでした');
    console.log('   手動でログインを完了してから、30秒待機します...');
    await page.waitForTimeout(30000);
  }

  // 認証状態を保存
  await context.storageState({ path: OPEX_AUTH_FILE });
  console.log(`✅ 認証状態を保存しました: ${OPEX_AUTH_FILE}\n`);

  await browser.close();
}

/**
 * MR君管理画面の認証をリフレッシュ
 */
async function refreshMrkunAuth(): Promise<void> {
  console.log('\n🔄 MR君管理画面の認証をリフレッシュしています...');
  console.log('ℹ️  MR君管理画面はQA環境プロキシを使用します（本番環境との識別のため）\n');

  const browser = await chromium.launch({
    headless: false,
    // MR君はURLが本番とQAで同じため、プロキシ設定が必須
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      // MR君はQA環境と本番環境でURLが同じため、プロキシ設定が必須
      proxy: {
        server: process.env.PROXY_SERVER || 'http://mrqa1:8888/proxy.pac',
      },
      ...(fs.existsSync(MRKUN_AUTH_FILE) ? { storageState: MRKUN_AUTH_FILE } : {}),
    });

    const page = await context.newPage();
    const loginUrl = 'https://mrkun.m3.com/admin/restricted/mt/OnePointDetail/list.jsp';

    console.log('ℹ️  ブラウザでログインしてください...');
    console.log('   1. 「Continue with Google」をクリック');
    console.log('   2. M3のGoogleアカウントでログイン');
    console.log('   3. MR君管理画面が表示されるまで待機（自動検出）\n');

    await page.goto(loginUrl, { timeout: 60000 });

    // MR君管理画面が表示されるまで待機（最大180秒）
    try {
      await page.waitForSelector('text=ワンポイント詳細', { timeout: 180000 });
      console.log('✅ MR君管理画面を検出しました');
    } catch (error) {
      console.log('⚠️  MR君管理画面を自動検出できませんでした');
      console.log('   手動でログインを完了してから、30秒待機します...');
      try {
        await page.waitForTimeout(30000);
      } catch (timeoutError) {
        console.log('⚠️  待機中にページが閉じられました。現在の状態で認証を保存します。');
      }
    }

    // 認証状態を保存
    try {
      await context.storageState({ path: MRKUN_AUTH_FILE });
      console.log(`✅ 認証状態を保存しました: ${MRKUN_AUTH_FILE}\n`);
    } catch (saveError) {
      console.log(`⚠️  認証状態の保存に失敗しました: ${saveError}`);
    }
  } catch (error) {
    console.log(`❌ MR君管理画面の認証リフレッシュ中にエラーが発生: ${error}`);
  } finally {
    try {
      await browser.close();
    } catch (closeError) {
      // ブラウザが既に閉じられている場合は無視
    }
  }
}

/**
 * グローバルセットアップのメイン処理
 * 認証ファイルが存在しない場合のみエラー
 * 存在する場合は鮮度に関わらずそのまま使用（警告のみ）
 */
async function globalSetup(config: FullConfig) {
  // 認証セットアップ時はチェックをスキップ
  if (process.env.SKIP_AUTH_CHECK === 'true') {
    console.log('\n🔧 認証セットアップモード: 認証ファイルチェックをスキップします\n');
    return;
  }

  console.log('\n========================================');
  console.log('🔐 認証ファイルの確認');
  console.log('========================================\n');

  // OPEX管理画面の認証ファイルをチェック
  console.log('📋 OPEX管理画面の認証ファイルをチェック中...');
  if (!fs.existsSync(OPEX_AUTH_FILE)) {
    console.log('❌ OPEX管理画面の認証ファイルが存在しません');
    console.log('   以下のコマンドで認証ファイルを作成してください:');
    console.log('   npx playwright test tests/setup/auth-opex.setup.ts --headed --project=setup\n');
    throw new Error('OPEX認証ファイルが存在しません');
  }

  const opexStats = fs.statSync(OPEX_AUTH_FILE);
  const opexAgeHours = (Date.now() - opexStats.mtimeMs) / (1000 * 60 * 60);
  if (opexAgeHours > 2) {
    console.log(`⚠️  OPEX認証ファイルは${opexAgeHours.toFixed(1)}時間前に作成されています（古い可能性）`);
  } else {
    console.log(`✅ OPEX認証ファイルは${opexAgeHours.toFixed(1)}時間前に作成されています`);
  }

  // MR君管理画面の認証ファイルをチェック
  console.log('\n📋 MR君管理画面の認証ファイルをチェック中...');
  if (!fs.existsSync(MRKUN_AUTH_FILE)) {
    console.log('❌ MR君管理画面の認証ファイルが存在しません');
    console.log('   以下のコマンドで認証ファイルを作成してください:');
    console.log('   npx playwright test tests/setup/auth-mrkun.setup.ts --headed --project=setup\n');
    throw new Error('MR君認証ファイルが存在しません');
  }

  const mrkunStats = fs.statSync(MRKUN_AUTH_FILE);
  const mrkunAgeHours = (Date.now() - mrkunStats.mtimeMs) / (1000 * 60 * 60);
  if (mrkunAgeHours > 2) {
    console.log(`⚠️  MR君認証ファイルは${mrkunAgeHours.toFixed(1)}時間前に作成されています（古い可能性）`);
  } else {
    console.log(`✅ MR君認証ファイルは${mrkunAgeHours.toFixed(1)}時間前に作成されています`);
  }

  console.log('\n========================================');
  console.log('✅ 認証ファイル確認完了');
  console.log('========================================\n');
}

export default globalSetup;
