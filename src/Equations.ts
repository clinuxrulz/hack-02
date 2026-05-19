export class Equations {
  rows: number[][] = [];

  clone(): Equations {
    let result = new Equations();
    for (let row of this.rows) {
      result.rows.push([ ...row, ]);
    }
    return result;
  }

  solve(): void {
    if (this.rows.length === 0) {
      return;
    }
    let numCols = this.rows[0].length;
    let minI = 0;
    for (let j = 0; j < numCols-1; ++j) {
      if (minI >= this.rows.length) {
        break;
      }
      let bestRow: number | undefined = undefined;
      let maxAbsVal: number | undefined = undefined;
      for (let i = minI; i < this.rows.length; ++i) {
        let absVal = Math.abs(this.rows[i][j]);
        if (maxAbsVal === undefined || absVal > maxAbsVal) {
          maxAbsVal = absVal;
          bestRow = i;
        }
      }
      if (bestRow === undefined || maxAbsVal === undefined) {
        continue;
      }
      if (maxAbsVal < 0.0001) {
        continue;
      }
      let val = this.rows[bestRow][j];
      if (bestRow !== minI) {
        for (let k = 0; k < numCols; ++k) {
          let tmp = this.rows[minI][k];
          this.rows[minI][k] = this.rows[bestRow][k];
          this.rows[bestRow][k] = tmp;
        }
      }
      for (let k = 0; k < numCols; ++k) {
        this.rows[minI][k] /= val;
      }
      for (let k = 0; k < this.rows.length; ++k) {
        if (k === minI) {
          continue;
        }
        let x = this.rows[k][j];
        for (let l = 0; l < numCols; ++l) {
          this.rows[k][l] -= x * this.rows[minI][l];
        }
      }
      ++minI;
    }
  }

  extractVars(out_vars: number[]): boolean {
    if (out_vars.length != this.rows.length) {
      return false;
    }
    for (let i = 0; i < this.rows.length; ++i) {
      if (Math.abs(this.rows[i][i] - 1.0) > 0.0001) {
        return false;
      }
      for (let k = 0; k < this.rows[i].length-1; ++k) {
        if (k === i) {
          continue;
        }
        if (Math.abs(this.rows[i][k]) > 0.0001) {
          return false;
        }
      }
      out_vars[i] = this.rows[i][this.rows[i].length-1];
    }
    return true;
  }
}
