# Unit1_OPD_標準テスト_ID5 (PC版) 実装完了

## 実装日時
2026-01-14

## 実装内容

### 1. 新規作成したPage Objects

#### M3PCLoginPage
- **ファイル**: `pages/dr/M3PCLoginPage.ts`
- **機能**: M3.com PC版へのログイン
- **主要メソッド**:
  - `goto()`: M3.comトップページに遷移
  - `login(loginId, password)`: ログイン実行
  - `loginToM3(loginId, password)`: goto + login のワンステップ実行

#### M3PCMessageListPage
- **ファイル**: `pages/dr/M3PCMessageListPage.ts`
- **機能**: M3.com PC版 メッセージ一覧ページ（OPD一覧）
- **主要メソッド**:
  - `goto()`: メッセージ一覧ページに遷移
  - `hasMessageWithTitle(title)`: 指定タイトルのメッセージ存在確認
  - `verifyFirstMessageTitle(expectedTitle)`: 最初のメッセージタイトル確認
  - `verifyCompanyName(expectedCompanyName)`: クライアント名確認
  - `verifyReceivedDate(expectedDate)`: 受信日確認
  - `verifyMinimumActionPoints(minActionPoints)`: 最小アクション数確認
  - `getCurrentActionPoints()`: 現在のアクションポイント取得
  - `verifyMessageInfo(title, companyName, receivedDate, minActionPoints)`: 包括的な情報確認（ID1, ID5用）
  - `clickMessageByTitle(title)`: メッセージクリックして詳細ページに遷移

#### M3PCMessageDetailPage
- **ファイル**: `pages/dr/M3PCMessageDetailPage.ts`
- **機能**: M3.com PC版 メッセージ詳細ページ（OPD詳細）
- **主要メソッド**:
  - `goto(opdId)`: メッセージ詳細ページに遷移
  - `verifyPageTitle(expectedPageTitle)`: ページタイトル確認
  - `verifyMessageTitle(expectedTitle)`: メッセージタイトル確認
  - `verifyCompanyName(expectedCompanyName)`: クライアント名確認
  - `verifyProfileImage(expectedImageUrlPattern)`: 顔写真画像確認
  - `getCurrentActionPoints()`: 現在のアクションポイント取得
  - `verifyMinimumActionPoints(minActionPoints)`: 最小アクション数確認
  - `verifyMessageDetailInfo(pageTitle, messageTitle, companyName, imageUrlPattern)`: 包括的な情報確認（ID6用）

#### MrkunAdminOpdCommonComponent
- **ファイル**: `pages/mrkunAdmin/common/MrkunAdminOpdCommonComponent.ts`
- **機能**: MR君管理画面の共通パーツ（新規作成）
- **主要メソッド**:
  - `MrkunLogin()`: MR君管理画面にログイン

### 2. 更新したPage Objects

#### MrkunAdminOpdListPage
- **ファイル**: `pages/mrkunAdmin/MrkunAdminOpdListPage.ts`
- **追加メソッド**:
  - `gotoOpdDetailByOpdId(opdId)`: OPD IDで絞り込んだOPD編集画面に遷移
  - `getOpenedCount()`: 開封数を取得（total: 総開封数, charged: うち課金）

### 3. テストファイル

#### unit1-opd-id5-pc.spec.ts
- **ファイル**: `tests/opdStandard/unit1-opd-id5-pc.spec.ts`
- **テスト対象ID**:
  - ID1: 課金対象者となる会員で新規作成したメッセージが一覧に表示されること
  - ID5: メッセージ一覧にメッセージ情報（タイトル、クライアント名、顔写真、進呈アクション数など)が正しく表示されること
  - ID6: メッセージ詳細にメッセージ情報（タイトル、クライアント名、顔写真、進呈アクション数など)が正しく表示されること
  - ID23: 開封数がカウントアップされないこと（未開封時）
  - ID24: 開封数がカウントアップされること（開封後）
  - ID29/ID30: 開封前は設定された開封アクション数が加算されないこと / 開封後は設定された開封アクション数が加算されること

- **テストフロー**:
  1. OPD作成（OPEX管理画面）
  2. 事前準備（OPD確率予測モデル登録）
  3. MR君管理画面でターゲット設定
  4. ID23: 開封数がカウントアップされないこと（未開封時）確認
  5. ID1, ID5: メッセージ一覧での表示確認
  6. ID30/ID29: 開封後のアクション数加算確認
  7. ID6: メッセージ詳細での表示確認
  8. ID24: 開封数がカウントアップされること（開封後）確認

## テスト実行前の準備

### 1. 認証状態の保存
```bash
# OPEX管理画面の認証
npx playwright test tests/setup/auth-opex.setup.ts --headed --project=setup

# MR君管理画面の認証
npx playwright test tests/setup/auth-mrkun.setup.ts --headed
```

### 2. 環境変数
- `BASE_URL`: OPEX管理画面のURL（デフォルト: https://opex-qa1.unit1.qa-a.m3internal.com）
- `TEST_SYS_CODE`: テスト用医師システムコード（デフォルト: 901584）
- `M3_PC_LOGIN_ID`: M3.com PC版ログインID（デフォルト: mrqa_auto046）
- `M3_PC_PASSWORD`: M3.com PC版パスワード（デフォルト: Autoqa1!）

### 3. ネットワーク要件
- VPN接続ON + WiFi接続 (192.168.0.x)
- プロキシ経由でアクセス（mrqa1:8888）

## テスト実行コマンド

```bash
# テスト実行
npx playwright test tests/opdStandard/unit1-opd-id5-pc.spec.ts

# ヘッドモードで実行（ブラウザを表示）
npx playwright test tests/opdStandard/unit1-opd-id5-pc.spec.ts --headed

# デバッグモードで実行
npx playwright test tests/opdStandard/unit1-opd-id5-pc.spec.ts --debug
```

## 次のステップ

1. テスト実行と動作確認
2. エラーがある場合は修正
3. Confluenceページの更新
4. ID13, ID14, ID15の実装検討

## 参考ファイル

- Mabl YAML: `v3KPglJ2EmrrGw6AGLZgIA-j-6.mabl.yml`
- Mabl Plan ID: `h1hfd3YwGptctDYziNt3bQ-p`
- Mabl Journey ID: `v3KPglJ2EmrrGw6AGLZgIA-j`
