# Unit1-other-e2e-test

Unit1の各種サービス（OPEX, MR君管理画面, M3.com SP版等）のE2Eテストプロジェクト

## フォルダ構成

```
.
├── fmt/                        # テストのフォーマット
├── pages/                      # page object
│   ├── opex/                  # OPEX管理画面
│   ├── mrkunAdmin/            # MR君管理画面
│   └── dr/                    # 医師向けページ（M3.com SP版等）
│
├── tests/                      # E2Eテスト
├── utils/                      # 全画面共通部品
└── data/                       # テストデータ

```

## 前提条件

### 認証状態の準備

#### OPEX管理画面
```bash
npx playwright test tests/setup/auth-opex.setup.ts --headed --project=setup
```

#### MR君管理画面
```bash
npx playwright test tests/setup/auth-mrkun.setup.ts --headed
```

### 環境変数設定

`.env`ファイルを作成し、以下の環境変数を設定:

```env
# OPEX管理画面
BASE_URL=https://opex-qa1.unit1.qa-a.m3internal.com
OPEX_GOOGLE_EMAIL=your_email@m3.com
OPEX_GOOGLE_PASSWORD=your_password

# MR君管理画面
MRKUN_ADMIN_URL=https://mrkun.m3.com
TEST_SYS_CODE=0000909180

# M3.com SP版
M3_SP_LOGIN_ID=mrqa_auto213
M3_SP_PASSWORD=Autoqa1!

# テストフロー
TEST_FLOW_ID=39
```

## Getting started

### macOS/Linux
```bash
# 初回のみ実施
npm install --global yarn
yarn install

# テスト実行
yarn playwright test

# 特定のテストファイルのみ実行
yarn playwright test tests/opdStandard/unit1-opd-id39.spec.ts

# UIモードで実行
yarn playwright test --ui

# プロジェクト指定で実行
yarn playwright test --project=chromium-desktop-vpn-direct
```

## テスト一覧

### OPD標準テスト
- `tests/opdStandard/unit1-opd-id39.spec.ts` - Unit1_OPD_標準テスト_ID39

## 主要な依存パッケージ

### @playwright/test
- **バージョン**: ^1.48.2
- **用途**: E2Eテストフレームワーク

### iconv-lite
- **バージョン**: ^0.7.0
- **用途**: CSVファイルのエンコーディング変換（Shift-JIS対応）
- **使用箇所**: `utils/utils.ts`の`downloadCsv()`関数
- **説明**: 日本語を含むCSVファイルをダウンロード・解析する際に使用

## ブラウザプロジェクト

### chromium-desktop-vpn-direct
VPN接続環境でプロキシなしで実行（推奨）

### chromium-desktop-proxy
プロキシ経由で実行（mrqa1:8888）

### chromium-mobile / chromium-mobile-vpn-direct
Galaxy S8モバイルビューポートでのテスト

## トラブルシューティング

### 認証エラー
認証状態が期限切れの場合、セットアップスクリプトを再実行してください。

### プロキシ接続エラー
- VPN接続を確認
- mrqa1プロキシ（192.168.2.130:8888 or mrqa1:8888）への接続を確認
- `chromium-desktop-vpn-direct`プロジェクトを使用（プロキシなし）

## 参考リンク

- [GitLab Project](https://rendezvous.m3.com/unit1-qa/unit1-other-e2e-test)
- [Playwright Documentation](https://playwright.dev/)
