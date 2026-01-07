// eslint.config.mjs
import globals from "globals";
import pluginPlaywright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // -----------------------------------------------------------
  // 1. 全体設定 (PageObjectsフォルダ も testsフォルダ も対象)
  // -----------------------------------------------------------
  {
    // 対象ファイル: すべての .ts, .js
    files: ["**/*.{ts,js}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // コンソールログの出しっぱなしを警告 警告不要の場合は"off"
      "no-console": ["warn", { allow: ["warn", "error"] }],
      //"no-console": "off",
      // 未使用変数の警告
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  
  // TypeScriptの推奨ルールを全ファイルに適用
  ...tseslint.configs.recommended,

  // -----------------------------------------------------------
  // 2. Playwrightテスト専用設定 (testsフォルダのみ対象)
  // -----------------------------------------------------------
  {
    // ★重要: ここにあなたのテストフォルダ名を指定します
    // 一般的に 'tests' や 'e2e', 'specs' などです
    files: ["tests/**/*.{ts,js}", "e2e/**/*.{ts,js}"],
    
    // Playwright推奨設定を展開
    ...pluginPlaywright.configs['flat/recommended'],
    
    rules: {
      ...pluginPlaywright.configs['flat/recommended'].rules,
      // テスト特有のルール調整
      "playwright/no-skipped-test": "warn", // skipされているテストを警告
      "playwright/no-focused-test": "error", // .only の残し忘れをエラーに
    },
  }
);