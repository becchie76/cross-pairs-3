/////////////////////////////////////////////
// 生徒クラス
//
// 作成者：K.TABEI
// 作成日：2020年3月26日
/////////////////////////////////////////////
class Student {

  // 【定数】
  // 出力用「1人」用文言
  private readonly OUT_ALONE_STR: string = '1人';
  // 入力判定用「1人」文言
  private readonly IN_ALONE_STR_ARR: string[] = [ '1人', '１人', '一人' ];
  // 入力判定用「欠席」文言
  private readonly IN_ABSENCE_STR_ARR: string[] = [ '欠', '休' ];
  // 入力判定用「退会」文言
  private readonly IN_WITHDRAW_STR_ARR: string[] = [ '退' ];

  // 生徒番号
  private readonly _aStudentNum: number;
  // 生徒のデータが格納されているセルの値
  private readonly _aStudentCellValues: string[];
  // 生徒名リスト
  private readonly _someStudentsNameList: string[];

  // 余りの生徒が発生したことによって「1人」となっているか
  private _isAloneBySurplus: boolean = false;
  // 出力用の今回レッスン値
  private _outCurrentLessonVal: string = '';

  /**
   * コンストラクタ
   * @param aStudentNum 生徒番号
   * @param aStudentCellValues 生徒のデータが格納されているセルの値（配列）
   *        0番目：生徒名  最後：今回のレッスンのデータ  残り：これまでのペア相手など
   * @param someStudentsNameList 生徒名リスト
   */
  constructor(aStudentNum: number, aStudentCellValues: string[], someStudentsNameList: string[]) {
    this._aStudentNum = aStudentNum;
    this._aStudentCellValues = aStudentCellValues;
    this._someStudentsNameList = someStudentsNameList;
  }

  /**
   * 生徒番号を返す
   */
  public get studentNum(): number {
    return this._aStudentNum;
  }

  /**
   * 生徒名を返す
   */
  public get studentName(): string {
    return this._aStudentCellValues[0];
  }

  /**
   * 退会しているかどうかを返す
   */
  public get wasWithdraw(): boolean {
    return this._aStudentCellValues.some(value =>
           0 < this.IN_WITHDRAW_STR_ARR.filter(value2 => value2 === value.charAt(0)).length);
  }

  /**
   * 今回のレッスンにて欠席かどうかを返す
   */
  public get isAbsence(): boolean {
    const char: string = this.lastIndexValue.charAt(0);
    return 0 < this.IN_ABSENCE_STR_ARR.filter(value => value === char).length;
  }

  /**
   * 今回授業で「1人」かどうかを返す
   */
  public get isAlone(): boolean {
    return this._isAloneBySurplus || 0 < this.IN_ALONE_STR_ARR.filter(value => value === this.lastIndexValue).length;
  }

  /**
   * 前回までの授業で「1人」だったときの回数を返す
   */
  public get aloneCount(): number {
    return this._aStudentCellValues.filter(value =>
      0 < this.IN_ALONE_STR_ARR.filter(value2 => value2 === value).length
    ).length;
  }

  /**
   * 相性が良くない生徒の配列を返す
   *   ※相性が良くない生徒の名前が配列に格納されている
   */
  public get incompatibles(): string[] {
    //return this._studentCellValues.filter(value => this.formatStudentName(value).incompatible)
    //                              .map(value => this.formatStudentName(value).studentName);

    //※↑のコードのほうが簡潔だが同じメソッドを2回呼び出しているのでパフォーマンスを考慮して↓のコードとする

    const result: string[] = [];
    for (const studentValue of this._aStudentCellValues) {
      const obj: { incompatible: boolean; studentName: string }
            = this.formatStudentName(studentValue);
      if (obj.incompatible) {
        result.push(obj.studentName);
      }
    }
    return result;
  }

  /**
   * 前回までのレッスンでの生徒ごとのペア回数配列を返す
   *   ※配列のインデックスと生徒インデックスが紐づけられていることに注意!!
   */
  public get beforePairs(): number[] {
    const result: number[] = new Array(this._someStudentsNameList.length).fill(0);
    for (let cnt = 0; cnt < this._someStudentsNameList.length; cnt++) {
      // ※「index !== 0」は配列の1番目を除外するための条件
      result[cnt] = this._aStudentCellValues.filter((value, index) =>
          index !== 0 &&
          this.formatStudentName(value).studentName === this._someStudentsNameList[cnt]
      ).length;
    }
    return result;
  }

  /**
   * 出力用の今回レッスン値を返す
   */
  public get outCurrentLessonVal(): string {
    if (this.isAlone || this._isAloneBySurplus) {
      return this.OUT_ALONE_STR;
    }
    return this.isAbsence || this.wasWithdraw ? this.lastIndexValue : this._outCurrentLessonVal;
  }

  /**
   * 出力用の今回のレッスン値を設定する
   */
  public set outCurrentLessonVal(value: string) {
    this._outCurrentLessonVal = value;
  }

  /**
   * 余りの生徒が発生したことによってこの生徒の今回レッスン値を「1人」に切り替える
   */
  public switchAloneBySurplus() {
    this._isAloneBySurplus = true;
  }

  /**
   * 「1人」文言を返す
   */
  public get aloneString(): string {
    return this.OUT_ALONE_STR;
  }

  /**
   * 生徒データ配列の最後の要素の値を返す
   */
  private get lastIndexValue(): string {
    return this._aStudentCellValues[this._aStudentCellValues.length - 1];
  }

  /**
   * 生徒名を名前と相性データに切り分ける
   * 生徒名の最後に相性が良くない印（'※'または'×'）が付いていたら
   * オブジェクトのプロパティincompatibleにtrueを設定。
   * 同時に、名前からはこれらの印を除外して同オブジェクトのプロパティstudentNameに設定。
   *   例1）
   *    引数：'たろう※'
   *    戻り値：studentName:'たろう', incompatible:true
   *   例2)
   *    引数：'じろう'
   *    戻り値：studentName:'じろう', incompatible:false
   * @param studentName 生徒名
   */
  private formatStudentName(studentName: string) {
    const result: { studentName: string, incompatible: boolean } = {
      studentName: '',
      incompatible: false
    };
    if (!studentName) return result;
    if ('※' === studentName.charAt(studentName.length - 1)
      || '×' === studentName.charAt(studentName.length - 1)) {
      result.studentName = studentName.slice(0, studentName.length - 1);
      result.incompatible = true;
    } else {
      result.studentName = studentName;
      result.incompatible = false;
    }
    return result;
  }
}
