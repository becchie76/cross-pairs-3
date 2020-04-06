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
  private readonly _studentNum: number;
  // 生徒のデータが格納されているセルの値
  private readonly _studentCellValues: string[];
  // 生徒名リスト
  private readonly _studentNameList: string[];

  // 余りの生徒が発生したことによって「1人」となっているか
  private _isAloneBySurplus: boolean = false;
  // 出力用の今回レッスン値
  private _outCurrentLessonVal: string = '';

  /**
   * コンストラクタ
   * @param studentNum 生徒番号
   * @param studentCellValues 生徒のデータが格納されているセルの値（配列）
   *        0番目：生徒名  最後：今回のレッスンのデータ  残り：これまでのペア相手など
   * @param studentNameList 生徒名リスト
   */
  constructor(studentNum: number, studentCellValues: string[], studentNameList: string[]) {
    this._studentNum = studentNum;
    this._studentCellValues = studentCellValues;
    this._studentNameList = studentNameList;
  }

  /**
   * 生徒番号を返す
   */
  public get studentNum(): number {
    return this._studentNum;
  }

  /**
   * 生徒名を返す
   */
  public get studentName(): string {
    return this._studentCellValues[0];
  }

  /**
   * 退会しているかどうかを返す
   */
  public get wasWithdraw(): boolean {
    return this._studentCellValues.some(value =>
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
    return this._studentCellValues.filter(value =>
      0 < this.IN_ALONE_STR_ARR.filter(value2 => value2 === value).length
    ).length;
  }

  /**
   * 相性が良くない生徒の配列を返す
   *   ※相性が良くない生徒の名前が配列に格納されている
   */
  public get incompatibles(): string[] {
    //return this._studentCellValues.filter(value => this.getCompatibilityObject(value).incompatible)
    //                              .map(value => this.getCompatibilityObject(value).studentName);

    //※↑のコードのほうが簡潔だが同じメソッドを2回呼び出しているのでパフォーマンスを考慮して↓のコードとする

    const arr: string[] = [];
    for (const studentValue of this._studentCellValues) {
      const obj: { incompatible: boolean; studentName: string }
            = this.getCompatibilityObject(studentValue);
      if (obj.incompatible) {
        arr.push(obj.studentName);
      }
    }
    return arr;
  }

  /**
   * 前回までのレッスンでの生徒ごとのペア回数配列を返す
   *   ※配列のインデックスと生徒インデックスが紐づけられていることに注意!!
   */
  public get beforePairs(): number[] {
    const arr: number[] = new Array(this._studentNameList.length).fill(0);
    for (let cnt = 0; cnt < this._studentNameList.length; cnt++) {
      // ※「index !== 0」は配列の1番目を除外するための条件
      arr[cnt] = this._studentCellValues.filter((value, index) =>
          index !== 0 &&
          this.getCompatibilityObject(value).studentName === this._studentNameList[cnt]
      ).length;
    }
    return arr;
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
    return this._studentCellValues[this._studentCellValues.length - 1];
  }

  /**
   * 相性と名前のオブジェクトを返す
   * 引数の生徒名をもとにした相性オブジェクトを生成して返す。
   * 生徒名の最後に相性が良くない印（'※'または'×'）が付いていたら
   * オブジェクトのプロパティincompatibleにtrueを設定。
   * 同時に、名前からはこれらの印を除外して同オブジェクトのプロパティstudentNameに設定。
   *   例1）
   *    引数：'たろう※'
   *    戻り値：incompatible:true, studentName:'たろう'
   *   例2)
   *    引数：'じろう'
   *    戻り値：incompatible:false, studentName:'じろう'
   * @param studentName 生徒名
   */
  private getCompatibilityObject(studentName: string) {
    const objResult: { studentName: string, incompatible: boolean } = {
      studentName: '',
      incompatible: false
    };

    if (!studentName) {
      return objResult;
    }

    // 文字列変数に格納しておく
    const strValue: string = studentName.toString();
    // 名前の最終文字を取得
    const charValue: string = strValue.charAt(strValue.length - 1);

    if ('※' === charValue || '×' === charValue) {
      objResult.studentName = strValue.slice(0, strValue.length - 1);
      objResult.incompatible = true;
    } else {
      objResult.studentName = strValue;
      objResult.incompatible = false;
    }

    return objResult;
  }
}
