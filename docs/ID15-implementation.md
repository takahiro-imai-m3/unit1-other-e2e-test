# Unit1_OPD_標準テスト_ID15 実装詳細

## 概要

**テストID**: ID15, ID18, ID31, ID34（4つのテストID）

**テスト名**: Unit1_OPD_標準テスト_ID15 - アクションなし・MR登録なしテスト

**実装日**: 2026-01-14

**実行時間**: 約3.5分（推定）

**Mabl参照**: Plan h1hfd3YwGptctDYziNt3bQ-p, Journey L8EkgD5O5hzBxGoTXEOQGg-j-7

## テスト条件

### 対象条件
- **コンテンツ種別**: 動画、その他（4つ）
- **アクション**: なし（開封アクション0、コンテンツアクション0）
- **MR登録**: なし（MR_IDは設定するが登録されない）

### 検証項目
- **ID15, ID18**: 動画、その他コンテンツを視聴することができ、視聴時にアクションが進呈されず、MR登録はされないこと
- **ID31**: 開封後も開封アクションが加算されないこと（ステータスアップアクション5pt のみ許容）
- **ID34**: クリック後もコンテンツのアクションが加算されないこと（ステータスアップアクション5pt のみ許容）

## システム構成

### 使用アカウント
- **システムコード**: 901490（推定）
- **ログインID**: mrqa_auto049
- **パスワード**: Autoqa1!

### システムコード対応関係
```
901468 → mrqa_auto046
901490 → mrqa_auto049 (推定)
901584 → mrqa_auto058
901910 → mrqa_auto213 (SP)
```

## テストフロー

### Part 1: OPEX管理画面でOPD作成
1. OPEX管理画面のOPD作成ページに遷移
2. 基本情報入力
   - 会社名: 自動テスト株式会社
   - 製品名: 自動テスト薬品
   - 依頼フォームID: YYYYMMDD + 7桁ランダム数字
   - 開封単価: 100
   - タイトル: `自動テストタイトルID15_YYYYMMDD_{3文字ランダム}`
   - 開封数リミット: 10
   - 開始日時: 当日 00:00:00
   - 終了日時: 当日 23:59:59
   - 配信終了日: チェック
   - 管理メモ: タイトルと同じ
3. メッセージ種類: 通常OPD
4. 開封アクション: 50（後で0に変更）
5. 合算チェック用会社: 9909000135
6. 埋め込み動画: 利用する（PCもSPもワンタグ）
7. PCディテール本文: `PCディテール本文コンテンツ`
8. SPディテール本文: PCからコピー
9. QFB報告: 対象外（出力する）
10. コンテンツ設定（アクションは後で0に変更）
    - 動画: dellegra_201501_01, アクション5
    - その他1: https://www.m3.com, アクション5
    - その他2: https://www.yahoo.co.jp/, アクション5
    - その他3: https://www.google.com/intl/ja_jp/about/, アクション5
    - OPD Quiz: https://mrkun.m3.com/mrq/contentsquiz/m3sMCD0001/1/quiz.htm, アクション5
    - MR君・myMR君登録: https://www.google.com/?hl=ja, アクション5
    - 添付文書: https://www.mhlw.go.jp/file/05-Shingikai-11121000-Iyakushokuhinkyoku-Soumuka/0000050568.pdf, アクション5
11. OPD作成実行

### Part 2: MR君管理画面でターゲット設定
1. MR君管理画面のOPD一覧ページに遷移
2. 作成したOPDを検索
3. ターゲット設定画面に遷移
4. システムコード901490を追加

### Part 3: OPD編集画面でアクションをすべて0に設定
1. OPD編集画面に遷移
2. 開封アクションを0に変更
3. MR_IDを「小松ゆう(大塚製薬株式会社)」に設定
4. 各コンテンツのアクションを0に変更
   - 動画（tr:nth-child(1)）: 0
   - その他1（tr:nth-child(2)）: 0
   - その他2（tr:nth-child(3)）: 0
   - その他3（tr:nth-child(4)）: 0
   - OPD Quiz（tr:nth-child(8)）: 0
   - MR君・myMR君登録（tr:nth-child(9)）: 0
   - 添付文書（tr:nth-child(10)）: 0
5. PCディテール本文を更新: `動画コンテンツ <div id="embedded-movie"></div>`
6. SPディテール本文: PCからコピー
7. 更新実行

### Part 4: 動画ファイルアップロード
1. JW Player動画アップロード画面に遷移
2. ファイル選択: `short movie.mp4`
3. Upload & Encodeボタンをクリック
4. アップロード完了待機（15秒）
5. 再度アップロード画面に遷移
6. 公開するボタンをクリック

### Part 5: M3.comログイン
1. M3.comログインページに遷移
2. ログインID: mrqa_auto049
3. パスワード: Autoqa1!
4. ログイン実行
5. 開封前のアクションポイントを取得

### Part 6: ID31 - 開封後も開封アクションが加算されないこと確認
1. 作成したOPDに遷移（メッセージ詳細ページ）
2. 開封処理完了待機（20秒）
3. ページリロード
4. 開封後のアクションポイントを取得
5. アクションポイントの差分を確認
   - 期待値: ≤5pt（ステータスアップアクションのみ）

### Part 7: ID15, ID18, ID34 - コンテンツ視聴時にアクションが加算されないこと確認
1. コンテンツ視聴前のアクションポイントを取得
2. iframe内の動画コンテンツをクリック（再生）
3. その他コンテンツ1をクリック（新しいタブが開く）
4. 新しいタブを閉じて元のタブに戻る
5. アクション反映待機（40秒）
6. ページリロード
7. アクション加算・変換履歴ページに遷移
8. コンテンツ視聴後のアクションポイントを取得
9. アクションポイントの差分を確認
   - 期待値: ≤5pt（ステータスアップアクションのみ）

### Part 8: MR登録されていないこと確認
1. MR君・myMR君・QOL君登録ページに遷移
2. 登録済みMRリストを取得
3. 「小松ゆう」が登録されていないことを確認

## 実装の技術的ポイント

### 1. OPDCreatePageの拡張
ID15実装のために、以下のメソッドを新規追加：
- `gotoEdit(opdId)`: OPD編集画面に遷移
- `setOpeningAction(actionPoints)`: 開封アクション設定
- `fillPCDetail(content)`: PCディテール本文入力
- `copyPCDetailToSPDetail()`: PCからSPへコピー
- `selectQfbReporting(isOutput)`: QFB報告設定
- `selectBillingCompany(companyCode)`: 合算会社選択
- `addMovieContent(movieId, actionPoints)`: 動画コンテンツ追加
- `addOtherContent(url, actionPoints)`: その他コンテンツ追加
- `addOpdQuizContent(url, actionPoints)`: Quiz追加
- `addMrRegistrationContent(url, actionPoints)`: MR登録コンテンツ追加
- `addAttachmentContent(url, actionPoints)`: 添付文書追加
- `uploadMovieFile(opdId, fileName)`: 動画ファイルアップロード（JW Player）
- `createOPD()`: OPD作成（簡易版）

### 2. 動画ファイルアップロード（JW Player）
```typescript
async uploadMovieFile(opdId: string, fileName: string) {
  // 動画アップロード画面に遷移
  const uploadUrl = `https://mrkun.m3.com/admin/restricted/jwplayer/upload.jsp?service=onepoint&movieId=${opdId}`;
  await this.page.goto(uploadUrl);

  // ファイル選択
  const fileInput = this.page.locator('input[type="file"]');
  await fileInput.setInputFiles(fileName);

  // Upload & Encode
  await this.page.locator('button', { hasText: 'Upload & Encode' }).click();
  await this.page.waitForTimeout(15000);

  // 公開する
  await this.page.goto(uploadUrl);
  await this.page.locator('button', { hasText: '公開する' }).click();
}
```

### 3. アクション加算なし確認の実装
ステータスアップアクション（5pt）のみ加算されることを許容：
```typescript
const actionDiff = actionAfterOpen - actionBeforeOpen;
expect(actionDiff).toBeLessThanOrEqual(5);
```

### 4. コンテンツテーブルのセレクタ
コンテンツごとに異なる行番号を使用：
- 動画: `tr:nth-child(1)`
- その他1: `tr:nth-child(2)`
- その他2: `tr:nth-child(3)`
- その他3: `tr:nth-child(4)`
- OPD Quiz: `tr:nth-child(8)`
- MR登録: `tr:nth-child(9)`
- 添付文書: `tr:nth-child(10)`

### 5. MR登録なし確認
MR_IDを設定してもMR登録されないことを確認：
```typescript
const mrListContent = await m3Page.locator('dl').innerText();
expect(mrListContent).not.toContain('小松ゆう');
```

## 新規作成ファイル

### テストファイル
- `tests/opdStandard/unit1-opd-id15.spec.ts` - ID15テスト本体

### Page Objectの拡張
- `pages/opex/OPDCreatePage.ts` - 12個の新規メソッドを追加

## 依存関係

### Page Objects
- `OPDCreatePage` - OPD作成・編集（拡張版）
- `MRkunAdminPage` - ターゲット設定
- `M3PCLoginPage` - M3.comログイン
- `M3PCMessageDetailPage` - メッセージ詳細表示、アクションポイント取得

### 環境変数
- `M3_PC_PASSWORD`: M3.com PC版パスワード（デフォルト: `Autoqa1!`）

### 外部ファイル
- `short movie.mp4`: JW Player動画アップロード用のテストファイル

## 実行方法

```bash
# 単体実行
yarn playwright test tests/opdStandard/unit1-opd-id15.spec.ts

# プロジェクト指定実行
yarn playwright test tests/opdStandard/unit1-opd-id15.spec.ts --project=chromium-desktop-vpn-direct

# UIモードで実行
yarn playwright test tests/opdStandard/unit1-opd-id15.spec.ts --ui

# デバッグモード
yarn playwright test tests/opdStandard/unit1-opd-id15.spec.ts --debug
```

## 既知の課題

### システムコードの確定
- 現在、システムコード901490を使用していますが、これは推定値です
- mrqa_auto049に対応する正しいシステムコードは、テスト実行時に確認が必要です
- 正しいシステムコードが判明したら、テストファイルを更新してください

### 動画ファイルパス
- `short movie.mp4`のファイルパスは相対パスまたは絶対パスを指定する必要があります
- テスト実行時にファイルが存在しない場合はエラーになります

## 今後の改善案

1. **システムコードの自動取得**: mrqa_auto049に対応するシステムコードをデータベースから取得
2. **動画ファイルの管理**: テストデータディレクトリに動画ファイルを配置
3. **リトライロジックの追加**: 動画アップロード失敗時のリトライ処理
4. **アクションポイント確認の精度向上**: ステータスアップアクション以外の加算がないことをより厳密に確認

## 参考資料

- Mabl YAML: `L8EkgD5O5hzBxGoTXEOQGg-j-7.mabl.yml`
- ID5 PC版実装: `docs/ID5-PC-implementation.md`
- ID10実装: `docs/ID10-implementation.md`
