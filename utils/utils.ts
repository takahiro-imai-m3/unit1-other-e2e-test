import { type Page, type Locator, type APIRequestContext } from '@playwright/test';
import { TestInfo } from '@playwright/test';
import * as iconv from 'iconv-lite';

/**
 * テスト開始時のヘッダーをコンソールに出力します。
 * @param testInfo TestInfo
 */
export function logTestStart(testInfo: TestInfo): void {
  console.log('========================================================================');
  console.log(`▼▼▼ TEST START: ${testInfo.title} ▼▼▼`);
  console.log('========================================================================');
}

/**
 * テスト終了時のフッターをコンソールに出力します。
 * @param testInfo TestInfo
 */
export function logTestEnd(testInfo: TestInfo): void {
  console.log('========================================================================');
  console.log(`▲▲▲ TEST END: ${testInfo.title} ▲▲▲`);
  console.log('========================================================================');
}

/**
 * ダイアログを処理します。
 * @param page PlaywrightのPageオブジェクト
 * @param accept ダイアログを承認する場合はtrue、拒否する場合はfalse。指定しない場合はtrue。
 */
export function handleDialog(page: Page, accept: boolean = true): void {
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    if (accept) {
      dialog.accept().catch(() => { });
    } else {
      dialog.dismiss().catch(() => { });
    }
  });
}

/**
 * 任意の時刻を指定されたフォーマットの文字列で返します。
 * フォーマットには以下のプレースホルダーを使用できます。
 * yyyy: 年 (4桁)
 * MM: 月 (2桁)
 * dd: 日 (2桁)
 * hh: 時 (2桁)
 * mm: 分 (2桁)
 * ss: 秒 (2桁)
 * @param format フォーマット文字列 (例: 'yyyyMMddhhmmss', 'yyyy-MM-dd')
 * @param date 任意の日時
 * @returns フォーマットされた日時文字列
 */
export function getFormattedDate(format: string,date:Date=new Date()): string {
  const targetDate = date;
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();
  const hours = targetDate.getHours();
  const minutes = targetDate.getMinutes();
  const seconds = targetDate.getSeconds();

  let formatted = format;
  formatted = formatted.replace(/yyyy/g, String(year));
  formatted = formatted.replace(/MM/g, String(month).padStart(2, '0'));
  formatted = formatted.replace(/dd/g, String(day).padStart(2, '0'));
  formatted = formatted.replace(/hh/g, String(hours).padStart(2, '0'));
  formatted = formatted.replace(/mm/g, String(minutes).padStart(2, '0'));
  formatted = formatted.replace(/ss/g, String(seconds).padStart(2, '0'));

  return formatted;
}
/**
 * 指定されたフォーマットと日数オフセットで日時文字列を生成します。
 * 大文字のYYYY/MM/DDフォーマットに対応したエイリアス関数。
 * @param format フォーマット文字列 (例: 'YYYY/MM/DD')
 * @param daysOffset 加算する日数 (デフォルトは0。負の数を指定すると減算)
 * @returns フォーマットされた日時文字列
 */
export function generateDateString(format: string, daysOffset: number = 0): string {
  const targetDate = new Date();

  if (daysOffset !== 0) {
    targetDate.setDate(targetDate.getDate() + daysOffset);
  }

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();
  const hours = targetDate.getHours();
  const minutes = targetDate.getMinutes();
  const seconds = targetDate.getSeconds();

  let formatted = format;
  // 大文字のYYYY/MM/DD形式に対応
  formatted = formatted.replace(/YYYY/g, String(year));
  formatted = formatted.replace(/yyyy/g, String(year));
  formatted = formatted.replace(/MM/g, String(month).padStart(2, '0'));
  formatted = formatted.replace(/DD/g, String(day).padStart(2, '0'));
  formatted = formatted.replace(/dd/g, String(day).padStart(2, '0'));
  formatted = formatted.replace(/HH/g, String(hours).padStart(2, '0'));
  formatted = formatted.replace(/hh/g, String(hours).padStart(2, '0'));
  formatted = formatted.replace(/mm/g, String(minutes).padStart(2, '0'));
  formatted = formatted.replace(/ss/g, String(seconds).padStart(2, '0'));

  return formatted;
}

/**
 * 任意の日時を指定された日数だけ加算し、指定されたフォーマットの文字列で返します。
 * フォーマットには以下のプレースホルダーを使用できます。
 * yyyy: 年 (4桁)
 * MM: 月 (2桁)
 * dd: 日 (2桁)
 * hh: 時 (2桁)
 * mm: 分 (2桁)
 * ss: 秒 (2桁)
 * @param format フォーマット文字列 (例: 'yyyyMMddhhmmss', 'yyyy-MM-dd')
 * @param baseDate 基準となる日時 (デフォルトは現在日時)
 * @param daysToAdd 加算する日数 (デフォルトは0。負の数を指定すると減算)
 * @returns フォーマットされた日時文字列
 */
export function getFormatDateAddDays(format: string, baseDate: Date = new Date(), dayOffset: number = 0): string {
  // 元のdateオブジェクトを変更しないように、新しいDateオブジェクトを作成
  const targetDate = new Date(baseDate);

  // daysToAddが0でない場合、日付を加算（または減算）
  if (dayOffset !== 0) {
    targetDate.setDate(targetDate.getDate() + dayOffset);
  }

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1; // getMonth()は0から始まるため+1
  const day = targetDate.getDate();
  const hours = targetDate.getHours();
  const minutes = targetDate.getMinutes();
  const seconds = targetDate.getSeconds();

  let formatted = format;
  formatted = formatted.replace(/yyyy/g, String(year));
  formatted = formatted.replace(/MM/g, String(month).padStart(2, '0'));
  formatted = formatted.replace(/dd/g, String(day).padStart(2, '0'));
  formatted = formatted.replace(/hh/g, String(hours).padStart(2, '0'));
  formatted = formatted.replace(/mm/g, String(minutes).padStart(2, '0'));
  formatted = formatted.replace(/ss/g, String(seconds).padStart(2, '0'));

  return formatted;
}
/**
* 引数で渡した日付の曜日を返します。
* @param dateString - 'YYYY/MM/DD' 形式の日付文字列
* @returns 曜日の文字列 (例: '金')
*/
export function  getWeekdayForDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('/').map(Number);
        
    // JavaScriptのDateオブジェクトは月を0から11で扱うため -1 する
    // new Date(string) はタイムゾーン解釈が不安定なため、数値で渡す
    const date = new Date(year, month - 1, day);
        
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        
    return weekdays[date.getDay()];

    } catch (e) {
        console.error('日付の解析に失敗しました:', e);
        return '不明';
    }
}
/**
 * 引数で指定した時間、処理を停止させる。
 * @param ms 待ち時間。ミリ秒で指定。
 * @returns {Promise<void>}
 */
export function sleep(ms: number): Promise<void> {
    // msミリ秒後に解決されるPromiseを返す
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * APIにGETリクエストを送信し、JSONレスポンスを取得します。
 * @param request APIRequestContextオブジェクト
 * @param url APIのエンドポイントURL
 * @returns レスポンスボディのJSONオブジェクト
 */
export async function getApiResponse<T>(request: APIRequestContext, url: string): Promise<T> {
  const response = await request.get(url);
  if (!response.ok()) {
    throw new Error(`APIリクエストが失敗しました: ${response.status()} ${response.statusText()}`);
  }
  return response.json();
}
/**
 * 指定された要素をクリックしてCSVをダウンロードし、その内容を文字列として返します。
 * @param page - PlaywrightのPageオブジェクト。
 * @param downloadLinkLocator - CSVダウンロードを開始する要素のLocator。
 * @param encoding - CSVファイルのエンコーディング（デフォルトは 'sjis'）。
 * @returns CSVファイルの内容を行ごとの文字列配列。
 */
export async function downloadCsv(page: Page, downloadLinkLocator: Locator, encoding: string = 'sjis'): Promise<string[]> {
  const downloadPromise = page.waitForEvent('download');
  await downloadLinkLocator.click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  if (!stream) {
    throw new Error("CSVファイルのダウンロードに失敗しました。");
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const csvContent = iconv.decode(Buffer.concat(chunks), encoding);
  // 改行で分割し、空行を除去して返す
  return csvContent.split(/\r?\n/).filter((line: string) => line.trim() !== '');
}
