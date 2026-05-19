import { createMemo, For, Show, type Component } from 'solid-js';
import { Fn, OUT_LEN } from './Fn';
import { Equations } from './Equations';

const App: Component = () => {
  let out: number[] = new Array(OUT_LEN);
  let fn = new Fn();
  fn.eval(0, out);
  let samples: [ number, number, ][] = [
    [ 1.0/6.0, 1.0, ],
    [ 2.0/6.0, 2.0, ],
    [ 3.0/6.0, 3.0, ],
    //[ 4.0/6.0, 4.0, ],
    //[ 5.0, 1.0, ],
  ];
  let equations = new Equations();
  for (let sample of samples) {
    fn.eval(sample[0], out);
    equations.rows.push([ ...out, sample[1], ]);
  }
  let result = equations.clone();
  result.solve();
  let vars: number[] = new Array(OUT_LEN);
  let success = result.extractVars(vars);
  let graphPath: string | undefined = undefined;
  let sampleMarkers: [number, number][] = [];
  if (success) {
    let scaleX = 400.0;
    let scaleY = 50;
    let pts: [number, number][] = [];
    for (let i = 0; i < 100; ++i) {
      let t = i / 100.0;
      let y = fn.evalVars(t, vars);
      pts.push([t, y]);
    }
    let centreY = 200.0;
    graphPath = `M ${pts[0][0]*scaleX} ${centreY - pts[0][1]*scaleY}`;
    for (let i = 1; i < pts.length; ++i) {
      graphPath += `L ${pts[i][0]*scaleX} ${centreY - pts[i][1]*scaleY}`;
    }
    for (let sample of samples) {
      sampleMarkers.push(
        [ sample[0]*scaleX, centreY - sample[1]*scaleY, ],
      );
    }
  }
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
      <hr/>
      <Show when={success}>
        <table
          style="border-collapse: collapse; margin-left: 5px; margin-top: 5px;"
        >
          <thead>
            <tr>
              <th>t</th>
              <th>sample</th>
              <th>prediction</th>
            </tr>
          </thead>
          <tbody>
            <For each={samples}>
              {(sample) => (
                <tr>
                  <td
                    style={{
                      "border": "1px solid black",
                      "padding": "5px",
                    }}
                  >
                    {sample[0].toFixed(4)}
                  </td>
                  <td
                    style={{
                      "border": "1px solid black",
                      "padding": "5px",
                    }}
                  >
                    {sample[1].toFixed(4)}
                  </td>
                  <td
                    style={{
                      "border": "1px solid black",
                      "padding": "5px",
                    }}
                  >
                    {fn.evalVars(sample[0], vars).toFixed(4)}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <hr/>
        <Show when={graphPath} keyed>
          {(graphPath) => (
            <svg width={400} height={400}>
              <path
                d={graphPath}
                stroke="black"
                stroke-width="2"
                fill="none"
              />
              <For each={sampleMarkers}>
                {(sampleMarker) => (
                  <circle
                    cx={sampleMarker[0]}
                    cy={sampleMarker[1]}
                    r="8"
                    stroke="red"
                    fill="none"
                    stroke-width="2"
                  />
                )}
              </For>
            </svg>
          )}
        </Show>
      </Show>
    </>
  );
};

export default App;
