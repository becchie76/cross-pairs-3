/////////////////////////////////////////////
// シートの選択状態をチェックするクラス
//
// 作成者：K.TABEI
// 作成日：2020年3月26日
/////////////////////////////////////////////
class SheetSelectedStateChecker {

  // Googleスプレッドシートのシートオブジェクト
  private _sheet: GoogleAppsScript.Spreadsheet.Sheet;

  /**
   * コンストラクタ
   * @param sheet Googleスプレッドシートのシートオブジェクト
   */
  constructor(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    this._sheet = sheet;
  }

  /**
   * チェックメソッド
   * チェックOKならtrue、チェックNGならfalseを返す
   * @param studentNameColNo 生徒名が登録されている列番号
   */
  public check(studentNameColNo: number): boolean {
    // 選択されているセル範囲情報
    const selectedRange: GoogleAppsScript.Spreadsheet.Range = this._sheet.getActiveRange();

    // 選択しているセルの列数
    const selectedColumns: number = selectedRange.getWidth();

    // ■チェック!! 選択中のセルの列数が1かどうか
    if (!this.check1Column(selectedColumns)) {
      return false;
    }

    // 選択している列数
    const selectedColumn: number = selectedRange.getColumn();

    // ■チェック!! ペア情報の設定が可能な列かどうか
    if (!this.checkProcessingColumn(selectedColumn, studentNameColNo)) {
      return false;
    }

    // 選択しているセルの最初の行
    const selected1stRow: number = selectedRange.getRow();
    // 選択している列の直上のセルの値を取得
    //   ※Date型を期待しているが何がくるか分からないのでany型で受け取る
    const upperCellValue: any = this._sheet.getRange(selected1stRow - 1, selectedColumn).getValue();

    // ■チェック!! 選択している列の直上のセルの値が日付かどうか
    if (!this.checkDate(upperCellValue)) {
      return false;
    }

    // 値が日付であることが分かったのでDate型に変換
    const upperCellDate: Date = upperCellValue as Date;

    // ■チェック!! 選択している列の直上のセルの日付が本日以降かどうか
    if (!this.checkFromNow(upperCellDate)) {
      return false;
    }

    return true;
  }

  /**
   * 列数が「1」かどうかをチェックするメソッド
   * ※列数が1でないならポップアップメッセージを表示する
   *
   * @param selectedColumns 選択中列数
   */
  private check1Column(selectedColumns: number): boolean {
    if (selectedColumns === 1) {
      return true;
    }

    if (selectedColumns < 1) {
      Browser.msgBox('列を指定していません。列を指定してから実行してください。');
    } else if (1 < selectedColumns) {
      Browser.msgBox('複数列を指定しています。1列のみ指定して実行してください。');
    }

    return false;
  }

  /**
   * 処理可能な列かどうかをチェックするメソッド
   * ※selectedColumnがimpossibleColumn以下の場合、処理を許さない
   * ※処理不可の場合はポップアップメッセージを表示する
   * @param selectedColumn 選択中の列
   * @param impossibleColNo 処理を許さない列番号
   */
  private checkProcessingColumn(selectedColumn: number, impossibleColNo: number): boolean {
    if (selectedColumn <= impossibleColNo) {
      Browser.msgBox('この列にはペア情報を設定できません。3列目以降の列を選択して実行してください。');
      return false;
    }
    return true;
  }

  /**
   * 引数が日付かどうかをチェックするメソッド
   * 日付ならtrue、日付でないならポップアップメッセージを表示してfalseを返す
   * @param value 何らかの値
   */
  private checkDate(value: any): boolean {
    try {
      return !(value.getFullYear() == null && value.getMonth() == null && value.getDate() == null);
    } catch (e) {
      Logger.log('【エラー】引数がDate型ではありません。');
      Browser.msgBox('日付の下のセルから選んでください。');
      return false;
    }
  }

  /**
   * 日付が本日以降かどうかをチェックするメソッド
   * ※本日以降でない、つまり昨日以前（過去）の場合はポップアップメッセージで注意を促す
   *   過去の場合であっても「YES」と回答されたら処理を実行するようにする
   * @param date 日付
   */
  private checkFromNow(date: Date): boolean {
    if (this.isLowerThanDate(date, new Date())) {
      return (
        'yes' === Browser.msgBox(
          '過去の日付のペア情報を設定しようとしています。処理してもよろしいですか？',
          Browser.Buttons.YES_NO));
    } else {
      return true;
    }
  }

  /**
   * 日付を比較するメソッド
   * ※時分秒は無視する
   * @param date1 日付1
   * @param date2 日付2
   */
  private isLowerThanDate(date1: Date, date2: Date): boolean {
    const year1: number = date1.getFullYear();
    const month1: number = date1.getMonth() + 1;
    const day1: number = date1.getDate();

    const year2: number = date2.getFullYear();
    const month2: number = date2.getMonth() + 1;
    const day2: number = date2.getDate();

    if (year1 === year2) {
      if (month1 === month2) {
        return day1 < day2;
      } else {
        return month1 < month2;
      }
    } else {
      return year1 < year2;
    }
  }
}
