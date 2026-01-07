/**
 * ページオブジェクト（ワンポイント医療情報編集画面）
 */
import { Locator, type Page } from '@playwright/test';
import { OpexOpdCommonComponent } from './common/OpexOpdCommonComponent';
import { getFormattedDate } from '../../utils/utils';

export class OpexOpdEditPage {
  readonly page: Page;
  readonly common: OpexOpdCommonComponent;
  readonly titleTextbox:Locator;
  readonly startTime:Locator;
  readonly thumbnail:Locator;
  readonly thumbnailInputFile:Locator;
  readonly copyButton:Locator;
  readonly okButton:Locator;

  constructor(page: Page) {
    this.page = page;
    this.common = new OpexOpdCommonComponent(page);
    this.titleTextbox=this.page.getByRole('textbox', { name: '*タイトル' });
    this.startTime=this.page.getByRole('textbox', { name: '*開始日時' });
    this.thumbnail=this.page.locator('#img_thumbnailTopMessageFile span');
    this.thumbnailInputFile=this.page.locator('//div/input[@type="file"]');
    this.copyButton=this.page.getByRole('button', { name: 'コピー作成' });
    this.okButton=this.page.getByRole('button', { name: 'OK' });
  }

   /**
   * タイトルを入力する
   * @param title - OPDのタイトル
   */
  async fillTitle(title: string): Promise<void> {
    await this.titleTextbox.fill(title);
  }

  /**
   * 開始日時を入力する
   * @param startTime - 開始日時。Date型
   */
  async fillStartTime(date:Date=new Date()): Promise<void> {
    const startTime=getFormattedDate('yyyy/MM/dd hh:mm:ss',date)
    await this.startTime.fill(startTime);
  }

  /**
   * サムネイル画像をアップロードする
   * @param filePath - アップロードする画像ファイルのパス
   */
  async uploadThumbnail(filePath: string='data/opdThumbnail/opd_thumbnail.jpg'): Promise<void> {
    await this.thumbnail.first().click();
    await this.thumbnailInputFile.setInputFiles(filePath);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * コピー作成ボタンをクリックし、確認ダイアログでOKをクリックする
   * @returns 作成されたOPDのID
   */
  async createCopy(): Promise<string> {
    await this.copyButton.click();
    await this.okButton.click();

    // URLが /edit/ パターンに変わるまで待機
    await this.page.waitForURL(/\/edit\/\d+/);

    // URLからIDを抽出
    const currentUrl = this.page.url();
    console.log('現在のURL:', currentUrl);
    const match = currentUrl.match(/\/edit\/(\d+)/);
    const opdId = match ? match[1] : null;

    if (!opdId) {
      throw new Error(`URLからIDを抽出できませんでした。URL: ${currentUrl}`);
    }

    console.log('抽出されたOPD ID:', opdId);
    return opdId;
  }

  /**
   * OPDをコピー作成する（一連の処理）
   * @param title - OPDのタイトル
   * @param startTime - 開始日時
   * @param thumbnailPath - サムネイル画像のパス
   * @returns 作成されたOPDのID
   */
  async copyOpd(title: string): Promise<string> {
    await this.fillTitle(title);
    await this.fillStartTime();
    await this.uploadThumbnail();
    return await this.createCopy();
  }
}
