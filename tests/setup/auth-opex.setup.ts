import { chromium, test as setup } from '@playwright/test';
import path from 'path';

/**
 * Google OAuth認証のセットアップ
 * 一度だけ手動でログインし、認証状態を保存します
 *
 * 実行方法:
 * npx playwright test tests/setup/auth.setup.ts --headed --project=setup
 */

const authFile = path.join(__dirname, '../../.auth/opex-user.json');

setup('Google OAuth認証状態を保存', async ({ }) => {
  const appUrl = process.env.BASE_URL || 'https://opex-qa1.unit1.qa-a.m3internal.com';
  const loginUrl = `${appUrl}/internal/dashboard`;

  console.log('\n=== Google OAuth認証セットアップ ===');
  console.log('このスクリプトは、ブラウザを開いて手動でログインしていただきます\n');
  console.log('手順:');
  console.log('1. ブラウザが自動的に開きます');
  console.log('2. Cognitoログインページで「Sign in with Google」をクリック');
  console.log('3. M3のGoogleアカウント(tak-imai@m3.com)でログイン');
  console.log('4. Google認証後、ブラウザのアドレスバーに以下を入力:');
  console.log(`   ${loginUrl}`);
  console.log('5. OPEX管理画面が表示されればOK');
  console.log('6. ブラウザはそのままにして、ターミナルでEnterキーを押してください');
  console.log('=====================================\n');

  // 独立したブラウザコンテキストを起動（タイムアウトなし）
  const browser = await chromium.launch({
    headless: false,
    // VPN経由の直接接続（プロキシを無効化）
    args: ['--no-proxy-server'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // VPN経由の直接接続（プロキシなし）
  });

  const page = await context.newPage();

  // ログインページに移動
  await page.goto(loginUrl);

  console.log('⏳ ブラウザでログインしてください...');
  console.log('   ログイン完了後、120秒待機してから自動的に認証状態を保存します\n');
  console.log('   ログインが完了したら、OPEX管理画面（ダッシュボード）が表示されていることを確認してください\n');

  // ダッシュボードのIDフィールドが表示されるまで待機（最大120秒）
  try {
    await page.waitForSelector('label:has-text("ID")', { timeout: 120000 });
    console.log('✓ ダッシュボード画面を検出しました');
  } catch (error) {
    console.log('⚠️  ダッシュボード画面を自動検出できませんでした。手動でログインを完了してください...');
    // さらに30秒待機
    await page.waitForTimeout(30000);
  }

  console.log('\n認証状態を保存中...');

  // 現在のURLを確認
  const currentUrl = page.url();
  console.log(`現在のURL: ${currentUrl}`);

  if (!currentUrl.includes('m3internal.com')) {
    console.error('\n❌ エラー: OPEX管理画面に戻っていません');
    console.error(`   ブラウザで ${loginUrl} にアクセスしてから、再度このスクリプトを実行してください`);
    await browser.close();
    throw new Error('OPEX管理画面に戻っていません');
  }

  // 認証状態を保存
  await context.storageState({ path: authFile });

  console.log(`✓ 認証状態を保存しました: ${authFile}`);
  console.log('\n✅ セットアップ完了！次回以降のテストでは、この認証状態が自動的に使用されます\n');

  await browser.close();
});
