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
   * @param studentsCellValues 生徒たちのデータが格納されているセルの値（配列）
   *        0番目：生徒名  最後：今回のレッスンのデータ  残り：これまでのペア相手など
   *        複数の生徒分あるので二次元配列となっている
   */
  public makeCurrentPairVals(studentsCellValues: string[][]): string[][] {
    // 生徒一人ひとりのインスタンスを生成して配列で保持
    let students: Student[] = this.createStudents(studentsCellValues);
    // 出力用の今回レッスン値を決める
    students = this.decideCurrentValues(students);
    // 今回のレッスン値を二次元配列に変換してリターン
    return this.change4SheetValue(students);
  }

  /**
   * すべての生徒の生徒クラスのインスタンスを生成して返す
   * @param studentsCellValues 生徒たちのデータが格納されているセルの値（配列）
   */
  private createStudents(studentsCellValues: string[][]): Student[] {
    // 生徒名リストを作成
    const studentNameList: string[] = studentsCellValues.map(value => value[0]);
    // 生徒一人ひとりのインスタンスを生成して配列で保持
    const students: Student[] = new Array(studentsCellValues.length);
    for (let num = 0; num < studentsCellValues.length; num++) {
      students[num] = new Student(num, studentsCellValues[num], studentNameList);
    }
    return students;
  }

  /**
   * ペア対象の生徒を返す
   *   今回のレッスンにて「欠席」,「退会(済)」,「1人」でない生徒のみを返す。
   * @param students 生徒配列
   */
  private getPairTargetStudents(students: Student[]): Student[] {
    return students.filter(value => !value.wasWithdraw && !value.isAbsence && !value.isAlone);
  }

  /**
   * 新しいペア相手等、今回のレッスンの値を決定して返す
   * @param students 生徒配列
   */
  private decideCurrentValues(students: Student[]): Student[] {

    // 生徒に余りが発生することによって「1人」となる生徒を決める
    this.decideAloneStudentBySurplus(students);

    // ここから生徒ひとりずつの処理
    // ペアを組むためにはまず、当該生徒が今回のレッスンに出席しなければなりません。
    // そのため、当該生徒が今回のレッスンに欠席する、事前に講師によって「1人」が入力されている、
    // またはすでに退会している生徒はペア組み処理をしません。
    // なお、このループ内でペア相手となった生徒はすでにペア相手が決まっているのでやはり処理しません。
    for (let student of students) {

      if (student.isAbsence || student.wasWithdraw || student.isAlone) {
        // すでに入力済の値をそのまま使用する
        student.outCurrentLessonVal = student.inCurrentLessonVal;
        continue;
      }
      // 当該生徒のペア相手がすでに決定している場合
      else if (0 < student.outCurrentLessonVal.length) {
        continue;
      }

      // ペア相手を決める
      const pairPartnerNum: number = this.decidePairPartner(student, students);

      // 今回の値配列の対象生徒にペア相手の生徒名を格納
      students[student.studentNum].outCurrentLessonVal
            = students.filter(value => value.studentNum === pairPartnerNum)[0].studentName;

      // 今回の値配列のペア相手生徒に処理中生徒の生徒名を格納
      students[pairPartnerNum].outCurrentLessonVal
            = students.filter(value => value.studentNum === student.studentNum)[0].studentName;
    }
    return students;
  }

  /**
   * 生徒に余りが発生することによって「1人」となる生徒を決める
   *   今回のレッスンで「休み」,「退会(済)」,すでに「1人」が設定されている生徒以外の生徒の数が
   *   奇数のときだけ「1人」になる生徒を決める。
   * @param students 生徒配列
   */
  private decideAloneStudentBySurplus(students: Student[]) {
    // ペア対象生徒だけを取得
    const pairTargetStudents: Student[] = this.getPairTargetStudents(students);

    if (pairTargetStudents.length % 2 === 1) {
      // ペア対象生徒の数が奇数の場合

      // ペア対象生徒が「1人」になった回数のうちもっとも少ない回数を取得
      const oneMinAlone: number
           = pairTargetStudents.reduce((pre, cur) => pre.aloneCount < cur.aloneCount ? pre : cur).aloneCount;

      // ペア対象生徒の中から「1人」でレッスンした回数がもっとも少ない生徒を抽出
      const oneMinStudents: Student[]
            = pairTargetStudents.filter(value => value.aloneCount === oneMinAlone);

      // 「1人」で授業した回数がもっとも少ない生徒の中からランダムで1人を抽出
      const targetStudentNo: number
            = oneMinStudents[Math.floor(Math.random() * oneMinStudents.length)].studentNum;

      // 抽出された生徒の今回レッスン値を「1人」に切り替える
      students[targetStudentNo].switchAloneBySurplus();
    }
  }

  /**
   * ペア相手を決める
   * @param doingStudent 処理中生徒
   * @param students 生徒配列
   */
  private decidePairPartner(doingStudent: Student, students: Student[]) : number {

    // ペア候補者を抽出する
    const candidateStudents: Student[] = this.extractCandidateStudents(doingStudent, students);

    // ペア相手を決めるための前回までのレッスンでのペア回数配列を生成
    const pairCountArray: number[] = this.createPairCountArray(doingStudent, candidateStudents);

    // もっとも少ないペア回数の生徒のインデックスNo.を要素とした配列を生成
    const leastPairCountStudents: number[] = this.createLeastPairCountStudents(pairCountArray);

    // もっとも少ないペア回数の生徒の中からランダムでペア相手を選ぶ
    const pairPartnerNum: number
          = leastPairCountStudents[Math.floor(Math.random() * leastPairCountStudents.length)];
    
    return pairPartnerNum;
  }

  /**
   * 処理中生徒のペア候補者を抽出する
   * @param doingStudent 処理中生徒
   * @param students 生徒配列
   */
  private extractCandidateStudents(doingStudent: Student, students: Student[]) : Student[] {
    // ペア候補者とは現在処理中の生徒のペア相手になるかもしれない生徒のことです。
    // ここではそのペア候補者を絞り込みます。
    // こちらも上と同様、今回のレッスンに欠席…などとなっている生徒は候補者から除外します。
    const candidateStudents: Student[] = []; // ペア候補者用生徒配列
    for (let num = 0; num < students.length; num++) {
      if (students[num].studentNum === doingStudent.studentNum  // 自分自身か
       || students[num].isAbsence                               // 欠席か
       || students[num].wasWithdraw                             // 退会しているか
       || students[num].isAlone                                 // 1人か
       || students[num].outCurrentLessonVal !== '') {           // 出力用のレッスン値がすでに設定されているか
        continue;
      }
      // 相性がよくない生徒もペア候補者としません
      if (0 < doingStudent.incompatibles.filter(value => value === students[num].studentName).length) {
        continue;
      }
      // ↑の条件をすべて突破した生徒をペア候補者に加えます
      candidateStudents.push(students[num]);
    }
    return candidateStudents;
  }

  /**
   * 前回までのレッスンでのペア回数配列を生成する
   * @param doingStudent 処理中生徒
   * @param candidateStudents ペア候補者生徒
   */
  private createPairCountArray(doingStudent: Student, candidateStudents: Student[]) : number[] {

    const studentsCount: number = doingStudent.beforePairs.length;
    // ペア相手を決めるための前回までのレッスンでのペア回数配列を生成
    //   ※初期値をすべてペア回数としてはありえないほどの大きな数値としておく
    const pairCountArray: number[] = new Array(studentsCount).fill(this.IMPOSSIBLE_BIG_NUMBER);
    // 前回までのレッスンでの生徒ごとのペア回数配列を取得
    const beforePairs: number[] = doingStudent.beforePairs;

    // ペア候補者の生徒だけ前回までのレッスンでのペア回数を↑で生成した配列に上書き
    // 非ペア候補者の生徒は上書きせずに値がありえないほどの大きな数値のままなのでこの↓の条件に引っかからない
    for (let num2 = 0; num2 < studentsCount; num2++) {
      if (0 < candidateStudents.filter(value => value.studentNum === num2).length) {
        pairCountArray[num2] = beforePairs[num2];
      }
    }
    return pairCountArray;
  }

  /**
   * もっとも少ないペア回数の生徒のインデックスNo.を要素とした配列を生成
   * @param pairCountArray 前回までのレッスンでのペア回数配列
   */
  private createLeastPairCountStudents(pairCountArray: number[]) : number[] {

    // もっとも少ないペア回数を取得
    const leastPairCount: number = pairCountArray.reduce((pre, cur) => (pre < cur ? pre : cur));

    // もっとも少ないペア回数の生徒のインデックスNo.を要素とした配列を生成
    const leastPairCountStudents: number[] = [];
    for (let num2 = 0; num2 < pairCountArray.length; num2++) {
      if (pairCountArray[num2] === leastPairCount) {
        leastPairCountStudents.push(num2);
      }
    }
    return leastPairCountStudents;
  }

  /**
   * 生徒インスタンスより出力用の今回レッスン値をシートに設定するための値(二次元配列)に変換する
   * @param students 生徒配列
   */
  private change4SheetValue(students: Student[]): string[][] {
    const result: string[][] = new Array(students.length);
    for (let num = 0; num < students.length; num++) {
      result[num] = new Array(students[num].outCurrentLessonVal);
    }
    return result;
  }
}