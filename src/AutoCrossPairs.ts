//////////////////////
// 自動ペア組みプログラム
//
// 作成者：K.TABEI
// 作成日：2020年3月17日
//////////////////////
const AutoCrossPairs = (): void => {

  // 【定数】生徒名が登録されているシートの列番号
  //   ※定数はGASのプロパティに登録すべきだが登録忘れなどが起こり面倒なことになるためここで定義
  const STUDENT_NAME_COL_NO = 2;

  // まずはじめにシート情報を取得
  const sheet: GoogleAppsScript.Spreadsheet.Sheet = SpreadsheetApp.getActiveSheet();

  // シートの選択状態をチェックする
  //   ※チェックNGなら何もせずに終了
  const checker: SheetSelectedStateChecker = new SheetSelectedStateChecker(sheet);
  if (!checker.check(STUDENT_NAME_COL_NO)) {
    return;
  }

  // 選択されているセル範囲情報
  const activeRange: GoogleAppsScript.Spreadsheet.Range = sheet.getActiveRange();

  // ■今回のペア相手などを決めて選択中の列に設定

  // 選択している列を含むこれまでのペア情報を取得
  const pairValues: string[][] = sheet.getRange(activeRange.getRow(),
                                                STUDENT_NAME_COL_NO,
                                                activeRange.getHeight(),
                                                activeRange.getColumn() - 1).getDisplayValues();

  // 生徒ラッパークラスのインスタンスを生成
  const studentWrapper: StudentWrapper = new StudentWrapper();

  // 選択中の今回の値を取得
  const currentValues: string[][] = studentWrapper.makeCurrentPairVals(pairValues);

  // 今回の値を選択している列に設定
  activeRange.setValues(currentValues);
}
