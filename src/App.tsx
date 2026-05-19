import { For, type Component } from 'solid-js';
import { Fn, OUT_LEN } from './Fn';
import { Equations } from './Equations';

const App: Component = () => {
  let out: number[] = new Array(OUT_LEN);
  let fn = new Fn();
  fn.eval(0, out);
  let samples: [ number, number, ][] = [
    [ 1.0, 1.0, ],
    [ 2.0, 2.0, ],
    [ 3.0, 2.0, ],
    [ 4.0, 1.0, ],
    //[ 5.0, 1.0, ],
  ];
  let equations = new Equations();
  for (let sample of samples) {
    fn.eval(sample[0], out);
    equations.rows.push([ ...out, sample[1], ]);
  }
  let result = equations.clone();
  result.solve();
  return (
    <>
      <table
        style="border-collapse: collapse; margin-left: 5px; margin-top: 5px;"
      >
        <thead/>
        <tbody>
          <For each={equations.rows}>
            {(row) => {
              return (
                <tr>
                  <For each={row}>
                    {(val, idx) => {
                      return (
                        <td
                          style={{
                            "border": `${idx() === row.length-1 ? "3" : "1"}px solid black`,
                            "padding": "5px",
                          }}
                        >
                          {val.toFixed(2)}
                        </td>
                      );
                    }}
                  </For>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
      <hr/>
      <table
        style="border-collapse: collapse; margin-left: 5px; margin-top: 5px;"
      >
        <thead/>
        <tbody>
          <For each={result.rows}>
            {(row) => {
              return (
                <tr>
                  <For each={row}>
                    {(val, idx) => {
                      return (
                        <td
                          style={{
                            "border": `${idx() === row.length-1 ? "3" : "1"}px solid black`,
                            "padding": "5px",
                          }}
                        >
                          {val.toFixed(2)}
                        </td>
                      );
                    }}
                  </For>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
    </>
  );
};

export default App;
