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
   * 生徒ごとの今回のデータ（ペア相手,「欠席」,「1人」 など）を返す
   * @param studentsCellValues 生徒たちのデータが格納されているセルの値（配列）
   *        0番目：生徒名  最後：今回のレッスンのデータ  残り：これまでのペア相手など
   *        複数の生徒分あるので二次元配列となっている
   */
  public getCurrentValues(studentsCellValues: string[][]): string[][] {
    // 生徒一人ひとりのインスタンスを生成して配列で保持
    const students: Student[] = this.createStudents(studentsCellValues);
    // 今回のレッスン値を取得
    const currentValues: string[] = this.decideCurrentValues(students);
    // 今回のレッスン値を二次元配列に変換してリターン
    return this.change4SheetValue(currentValues);
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
   * 生徒に余りが発生することによって「1人」となる生徒を返す
   *   今回のレッスンで「休み」,「退会(済)」,すでに「1人」が設定されている生徒以外の生徒の数が
   *   奇数のときだけ「1人」になる生徒を返す。返すのは生徒の生徒番号。
   *   ただし生徒の数が偶数のときは新たに「1人」になる生徒はいないので -1 を返す。
   * @param students 生徒配列
   */
  private getAloneStudentBySurplus(students: Student[]): number {
    // ペア対象生徒だけを取得
    const pairTargetStudents: Student[] = this.getPairTargetStudents(students);

    if (pairTargetStudents.length % 2 === 1) {
      // ペア対象生徒の数が奇数の場合

      // ペア対象生徒が「1人」になった回数のうちもっとも少ない回数を取得
      const oneMinAlone: number = pairTargetStudents.reduce((pre, cur) =>
        pre.aloneCount < cur.aloneCount ? pre : cur
      ).aloneCount;

      // ペア対象生徒の中から「1人」でレッスンした回数がもっとも少ない生徒を抽出
      const oneMinStudents: Student[] = pairTargetStudents.filter(
        value => value.aloneCount === oneMinAlone
      );

      // 「1人」で授業した回数がもっとも少ない生徒の中からランダムで1人を抽出
      const targetStudentNo: number =
        oneMinStudents[Math.floor(Math.random() * oneMinStudents.length)].studentNum;

      return targetStudentNo;
    } else {
      // ペア対象生徒の数が偶数の場合
      return -1;
    }
  }

  /**
   * 新しいペア相手等、今回のレッスンの値を決定して返す
   * @param students 生徒配列
   */
  private decideCurrentValues(students: Student[]): string[] {
    // 今回の値配列を生徒数分生成（空文字で初期化）
    const currentVals: string[] = new Array(students.length).fill('');

    // 生徒に余りが発生することによって「1人」となる生徒の生徒No.を取得
    const aloneStudent4Surplus: number = this.getAloneStudentBySurplus(students);

    // ここから生徒ひとりずつの処理
    for (let num = 0; num < students.length; num++) {
      // 当該生徒が今回のレッスンで「欠席」,「退会(済)」,「1人」の場合
      if (students[num].isAbsence || students[num].wasWithdraw || students[num].isAlone) {
        // すでに入力済の値をそのまま使用する
        currentVals[num] = students[num].currentLessonValue;
        // 次の生徒へ
        continue;
      }
      // 生徒に余りが発生することによって当該生徒が「1人」となる場合
      else if (students[num].studentNum === aloneStudent4Surplus) {
        // 「1人」文言を埋め込む
        currentVals[num] = students[num].aloneString;
        // 次の生徒へ
        continue;
      }
      // 当該生徒のペア相手がすでに決定している場合
      else if (0 < currentVals[num].length) {
        // 何もせずに次の生徒へ
        continue;
      }

      // ペア候補者用生徒配列
      const candidateStudents: Student[] = [];

      // ここからペア候補者ひとりずつの処理
      for (let num2 = 0; num2 < students.length; num2++) {
        // 自分自身の場合、今回のレッスンで「欠席」,「退会(済)」,「1人」のいずれかの場合、
        // 余りが発生したことにより「1人」となった場合1、
        // またはペア相手がすでに決定している場合はペア候補者としない
        if (students[num2].studentNum === students[num].studentNum
         || students[num2].isAbsence
         || students[num2].wasWithdraw
         || students[num2].isAlone
         || students[num2].studentNum === aloneStudent4Surplus
         || 0 < currentVals[num2].length) {
          continue;
        }
        // 相性がよくない生徒もペア候補者としない
        if (0 < students[num].incompatibles.filter(value => value === students[num2].studentName).length) {
          continue;
        }
        // ↑の条件をすべて突破した生徒をペア候補者に加える
        candidateStudents.push(students[num2]);
      }

      // ペア相手を決めるための前回までのレッスンでのペア回数配列を生成
      //   ※初期値をすべてペア回数としてはありえないほどの大きな数値としておく
      const pairCountArray: number[] = new Array(students.length).fill(this.IMPOSSIBLE_BIG_NUMBER);
      // 前回までのレッスンでの生徒ごとのペア回数配列を取得
      const beforePairs: number[] = students[num].beforePairs;

      // ペア候補者の生徒だけ前回までのレッスンでのペア回数を↑で生成した配列に上書き
      // 非ペア候補者の生徒は上書きせずに値がありえないほどの大きな数値のままなのでこの↓の条件に引っかからない
      for (let num2 = 0; num2 < students.length; num2++) {
        if (0 < candidateStudents.filter(value => value.studentNum === num2).length) {
          pairCountArray[num2] = beforePairs[num2];
        }
      }

      // もっとも少ないペア回数を取得
      const leastPairCount: number = pairCountArray.reduce((pre, cur) => (pre < cur ? pre : cur));
      // もっとも少ないペア回数の生徒のインデックスNo.を要素とした配列を生成
      const leastPairCountStudents: number[] = [];
      for (let num2 = 0; num2 < pairCountArray.length; num2++) {
        if (pairCountArray[num2] === leastPairCount) {
          leastPairCountStudents.push(num2);
        }
      }

      // もっとも少ないペア回数の生徒の中からランダムでペア相手を選ぶ
      const pairPartnerNum: number
        = leastPairCountStudents[Math.floor(Math.random() * leastPairCountStudents.length)];

      // 今回の値配列の対象生徒にペア相手の生徒名を格納
      currentVals[students[num].studentNum]
        = students.filter(value => value.studentNum === pairPartnerNum)[0].studentName;

      // 今回の値配列のペア相手生徒に処理中生徒の生徒名を格納
      currentVals[pairPartnerNum]
        = students.filter(value => value.studentNum === students[num].studentNum)[0].studentName;
    }

    return currentVals;
  }

  /**
   * 今回のレッスンの値(一次元配列)をシートに設定するための値(二次元配列)に変換する
   * @param currentValues 今回のレッスンの値
   */
  private change4SheetValue(currentValues: string[]): string[][] {
    const result: string[][] = new Array(currentValues.length);
    for (let index = 0; index < currentValues.length; index++) {
      result[index] = new Array(currentValues[index]);
    }
    return result;
  }
}
