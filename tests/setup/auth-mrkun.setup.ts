import { chromium, test as setup } from '@playwright/test';
import path from 'path';

/**
 * MR君管理画面 Google OAuth認証のセットアップ
 * 一度だけ手動でログインし、認証状態を保存します
 *
 * 実行方法:
 * npx playwright test tests/setup/mrkun-auth.setup.ts --headed
 */

const authFile = path.join(__dirname, '../../.auth/mrkun-user.json');

setup('MR君管理画面 Google OAuth認証状態を保存', async ({ }) => {
  const mrkunUrl = process.env.MRKUN_ADMIN_URL || 'https://mrkun.m3.com';
  const loginUrl = `${mrkunUrl}/admin/restricted/mt/OnePointDetail/list.jsp`;

  console.log('\n=== MR君管理画面 Google OAuth認証セットアップ ===');
  console.log('このスクリプトは、ブラウザを開いて手動でログインしていただきます\n');
  console.log('手順:');
  console.log('1. ブラウザが自動的に開きます');
  console.log('2. ログインページで「Continue with Google」をクリック');
  console.log('3. M3のGoogleアカウントでログイン');
  console.log('4. Google認証完了後、ブラウザのアドレスバーに以下のURLを入力してEnterを押してください:');
  console.log(`   ${loginUrl}`);
  console.log('5. MR君管理画面が表示されればOK');
  console.log('6. 180秒待機後、自動的に認証状態を保存します');
  console.log('========================================================\n');

  // プロキシ経由でブラウザを起動
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://mrqa1:8888', // mrqa1プロキシ
    },
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // ログインページに移動
  await page.goto(loginUrl);

  console.log('⏳ ブラウザでログインしてください...');
  console.log('   ログイン完了後、180秒待機してから自動的に認証状態を保存します\n');
  console.log('   ログインが完了したら、MR君管理画面が表示されていることを確認してください\n');

  // 管理画面の要素が表示されるまで待機（最大180秒）
  try {
    // MR君管理画面のタイトルを待機
    await page.waitForSelector('h1:has-text("ワンポイント医療情報管理")', { timeout: 180000 });
    console.log('✓ MR君管理画面を検出しました');
  } catch (error) {
    console.log('⚠️  MR君管理画面を自動検出できませんでした。手動でログインを完了してください...');
    // さらに60秒待機
    await page.waitForTimeout(60000);
  }

  console.log('\n認証状態を保存中...');

  // 現在のURLを確認
  const currentUrl = page.url();
  console.log(`現在のURL: ${currentUrl}`);

  if (!currentUrl.includes('mrkun.m3.com') && !currentUrl.includes('myaccount.google.com')) {
    console.error('\n❌ エラー: 予期しないページです');
    console.error(`   現在のURL: ${currentUrl}`);
    console.error(`   ブラウザで ${loginUrl} にアクセスしてから、再度このスクリプトを実行してください`);
    await browser.close();
    throw new Error('予期しないページです');
  }

  // Googleアカウント画面の場合は警告を出すが続行
  if (currentUrl.includes('myaccount.google.com')) {
    console.warn('\n⚠️  警告: まだGoogleアカウント画面にいます');
    console.warn(`   ブラウザのアドレスバーに以下のURLを入力してください:`);
    console.warn(`   ${loginUrl}`);
    console.warn('\n   ※このまま認証状態を保存しますが、MR君管理画面にアクセスできない可能性があります');
  }

  // 認証状態を保存
  await context.storageState({ path: authFile });

  console.log(`✓ 認証状態を保存しました: ${authFile}`);
  console.log('\n✅ セットアップ完了！次回以降のテストでは、この認証状態が自動的に使用されます\n');

  await browser.close();
});
