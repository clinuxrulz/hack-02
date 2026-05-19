export const DEGREE = 12;
export const OUT_LEN = DEGREE;

export class Fn {
  eval(t: number, out: number[]) {
    if (out.length !== OUT_LEN) {
      throw new Error("out wrong size");
    }
    let k = 0;
    for (let i = 0; i < DEGREE; ++i) {
      out[k++] = Math.cos(t * i * 2.0 * Math.PI);
    }
  }

  evalVars(t: number, vars: number[]): number {
    if (vars.length !== OUT_LEN) {
      throw new Error("out wrong size");
    }
    let result = 0.0;
    for (let i = 0; i < DEGREE; ++i) {
      result += vars[i] * Math.cos(t * i * 2.0 * Math.PI);
    }
    return result;
  }
}
