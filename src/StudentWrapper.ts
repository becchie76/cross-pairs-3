/////////////////////////////////////////////
// 生徒ラッパークラス
//
// 作成者：K.TABEI
// 作成日：2020年3月26日
/////////////////////////////////////////////
class StudentWrapper {

  // 【定数】ペア回数としてはありえないほどの大きな数値
  private readonly IMPOSSIBLE_BIG_NUMBER: number = 9999;

  /**
   * 生徒ごとの今回のデータ（ペア相手,「欠席」,「1人」 など）をつくる
   * @param someStudentsCellValues 生徒たちのデータが格納されているセルの値リスト
   *        0番目：生徒名  最後：今回のレッスンのデータ  残り：これまでのペア相手など
   *        複数の生徒分あるので二次元配列となっている
   */
  public makeCurrentPairValues(someStudentsCellValues: string[][]): string[][] {
    // 出力用の今回レッスン値を決める
    const someStudents: Student[] = this.decideCurrentValues(someStudentsCellValues);
    // 今回のレッスン値を出力用データに変換してリターン
    return this.changeOutputValue(someStudents);
  }

  /**
   * 新しいペア相手等、今回のレッスンの値を決定して返す
   * @param someStudentsCellValues 生徒たちのデータが格納されているセルの値リスト
   */
  private decideCurrentValues(someStudentsCellValues: string[][]): Student[] {
    let someStudents: Student[] = this.createStudents(someStudentsCellValues);

    // 生徒に余りが発生することによって「1人」となる生徒を決める
    const aloneStudentNum: number = this.aloneBySurplusStudentNum(someStudents);
    if (aloneStudentNum !== -1) {
      someStudents[aloneStudentNum].switchAloneBySurplus();
    }

    for (const aStudent of someStudents) {
      // 出力用の今回レッスン値がすでに決まっていない場合にのみペア相手を決める
      if (aStudent.outCurrentLessonVal.length === 0) {
        // ペア相手を決める
        const pairPartnerNum: number = this.decidePairPartner(aStudent, someStudents);
        // 今回の値配列の対象生徒にペア相手の生徒名を格納
        aStudent.outCurrentLessonVal = this.studentName(pairPartnerNum, someStudents);
        // 今回の値配列のペア相手生徒に処理中生徒の生徒名を格納
        someStudents[pairPartnerNum].outCurrentLessonVal
            = this.studentName(aStudent.studentNum, someStudents);
      }
    }
    return someStudents;
  }

  /**
   * すべての生徒の生徒クラスのインスタンスを生成して返す
   * @param someStudentsCellValues 生徒たちのデータが格納されているセルの値リスト
   */
  private createStudents(someStudentsCellValues: string[][]): Student[] {
    const someStudentsNameList: string[] = someStudentsCellValues.map(value => value[0]);
    return someStudentsCellValues.map((value, index) => new Student(index, value, someStudentsNameList));
  }

  /**
   * 生徒に余りが発生することによって「1人」となる生徒を決める
   *   今回のレッスンで「休み」,「退会(済)」,すでに「1人」が設定されている生徒以外の生徒の数が
   *   奇数のときだけ新たに「1人」になる生徒を決める。
   *   生徒の数が偶数のときは新たに「1人」になる生徒はいないので -1 を返す。
   * @param someStudents 生徒リスト
   */
  private aloneBySurplusStudentNum(someStudents: Student[]) : number {
    // 今回のレッスンにて「欠席」,「退会(済)」,「1人」でない生徒のみ抽出
    const pairTargetStudents: Student[]
          = someStudents.filter(value => !value.isAbsence && !value.wasWithdraw && !value.isAlone);
    // ペア対象生徒の数が奇数の場合のみ新たな「1人」を決める
    if (pairTargetStudents.length % 2 === 1) {
      // ペア対象生徒が「1人」になった回数のうちもっとも少ない回数を取得
      const oneMinAlone: number
            = pairTargetStudents.reduce((pre, cur) => pre.aloneCount < cur.aloneCount ? pre : cur).aloneCount;
      // ペア対象生徒の中から「1人」でレッスンした回数がもっとも少ない生徒を抽出
      const oneMinStudents: Student[]
            = pairTargetStudents.filter(value => value.aloneCount === oneMinAlone);
      // 「1人」で授業した回数がもっとも少ない生徒の中からランダムで1人を抽出して返す
      return oneMinStudents[Math.floor(Math.random() * oneMinStudents.length)].studentNum;
    }
    else return -1;
  }

  /**
   * ペア相手を決める
   * @param doingStudent 処理中生徒
   * @param someStudents 生徒リスト
   */
  private decidePairPartner(doingStudent: Student, someStudents: Student[]) : number {
    // ペア候補者を抽出
    const candidateStudents: Student[] = this.extractPairCandidateStudents(doingStudent, someStudents);
    // ペア相手を決めるための前回までのレッスンでのペア回数配列を生成
    const pairCountArray: number[] = this.createPairCountArray(doingStudent, candidateStudents);
    // もっとも少ないペア回数の生徒のインデックスNo.を要素とした配列を生成
    const leastPairCountStudents: number[] = this.createLeastPairCountStudents(pairCountArray);
    // もっとも少ないペア回数の生徒の中からランダムでペア相手を選ぶ
    const result: number = leastPairCountStudents[Math.floor(Math.random() * leastPairCountStudents.length)];
    return result;
  }

  /**
   * 処理中生徒のペア候補者を抽出する
   * @param doingStudent 処理中生徒
   * @param someStudents 生徒リスト
   */
  private extractPairCandidateStudents(doingStudent: Student, someStudents: Student[]) : Student[] {
    const result: Student[] = [];
    for (const aStudent of someStudents) {
      if (aStudent.studentNum === doingStudent.studentNum  // 自分自身か
       || aStudent.isAbsence                               // 欠席か
       || aStudent.wasWithdraw                             // 退会しているか
       || aStudent.isAlone                                 // 1人か
       || aStudent.outCurrentLessonVal !== '') {           // 出力用のレッスン値がすでに設定されているか
        continue;
      }
      // 相性がよくない生徒もペア候補者としない
      if (0 < doingStudent.incompatibles.filter(value => value === aStudent.studentName).length) {
        continue;
      }
      // ↑の条件をすべて突破した生徒をペア候補者に加える
      result.push(aStudent);
    }
    return result;
  }

  /**
   * 前回までのレッスンでのペア回数配列を生成する
   * @param doingStudent 処理中生徒
   * @param candidateStudents ペア候補者生徒リスト
   */
  private createPairCountArray(doingStudent: Student, candidateStudents: Student[]) : number[] {
    const studentsCount: number = doingStudent.beforePairs.length;
    // ペア相手を決めるための前回までのレッスンでのペア回数リストを生成
    //   ※初期値をすべてペア回数としてはありえないほどの大きな数値としておく
    const result: number[] = new Array(studentsCount).fill(this.IMPOSSIBLE_BIG_NUMBER);
    // 前回までのレッスンでの生徒ごとのペア回数リストを取得
    const beforePairs: number[] = doingStudent.beforePairs;
    // ペア候補者の生徒だけ前回までのレッスンでのペア回数を↑で生成した配列に上書き
    // 非ペア候補者の生徒は上書きせずに値がありえないほどの大きな数値のままなのでこの↓の条件に引っかからない
    for (let num = 0; num < studentsCount; num++) {
      if (0 < candidateStudents.filter(value => value.studentNum === num).length) {
        result[num] = beforePairs[num];
      }
    }
    return result;
  }

  /**
   * もっとも少ないペア回数の生徒のインデックスNo.を要素としたリストを生成
   * @param pairCountArray 前回までのレッスンでのペア回数リスト
   */
  private createLeastPairCountStudents(pairCountArray: number[]) : number[] {
    // もっとも少ないペア回数を取得
    const leastPairCount: number = pairCountArray.reduce((pre, cur) => (pre < cur ? pre : cur));
    // もっとも少ないペア回数の生徒のインデックスNo.を要素とした配列を生成
    const result: number[] = [];
    for (let num = 0; num < pairCountArray.length; num++) {
      if (pairCountArray[num] === leastPairCount) result.push(num);
    }
    return result;
  }

  /**
   * 生徒No.に該当する生徒名
   * @param studentNum 生徒No.
   * @param someStudents 生徒リスト
   */
  private studentName(studentNum: number, someStudents: Student[]) : string {
    return someStudents.filter(value => value.studentNum === studentNum)[0].studentName;
  }

  /**
   * 生徒インスタンスより出力用の今回レッスン値をシートに設定するための値(二次元配列)に変換する
   * @param someStudents 生徒リスト
   */
  private changeOutputValue(someStudents: Student[]): string[][] {
    const result: string[][] = new Array(someStudents.length);
    for (let num = 0; num < someStudents.length; num++) {
      result[num] = new Array(someStudents[num].outCurrentLessonVal);
    }
    return result;
  }
}
