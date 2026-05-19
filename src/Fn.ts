export const DEGREE = 4;
export const OUT_LEN = DEGREE;

export class Fn {
  eval(t: number, out: number[]) {
    if (out.length !== OUT_LEN) {
      throw new Error("out wrong size");
    }
    let k = 0;
    for (let i = 0; i < DEGREE; ++i) {
      out[k++] = Math.pow(t, i);
    }
  }
}
