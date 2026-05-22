import { batch, createMemo, For, Show, type Component } from 'solid-js';
import { Fn, OUT_LEN } from './Fn';
import { Equations } from './Equations';
import myAudioWorkletProcessorUrl from "./audio-worklet-processor?worker&url";
import { createStore } from 'solid-js/store';

async function setupAudio(): Promise<{
  audioCtx: AudioContext,
  audioNode: AudioWorkletNode,
}> {
  let audioCtx = new AudioContext();
  await audioCtx.audioWorklet.addModule(myAudioWorkletProcessorUrl);
  let audioNode = new AudioWorkletNode(audioCtx, "my-audio-worklet-processor");
  audioNode.connect(audioCtx.destination);
  //await audioCtx.resume();
  return {
    audioCtx,
    audioNode,
  };
}

const data =
{
  "song_title": "Fallen Down (Intro Loop)",
  "game": "Undertale",
  "time_signature": "3/4",
  "index_system": "Middle C (C4) = 0, Semitone steps",
  "note_duration_legend": {
    "quarter_note": 1.0,
    "description": "Values represent beats. In 3/4 time, each beat is 1.0"
  },
  "notes": [
    {"bar": 1, "beat": 1.0, "duration": 1.0, "left_hand": -10, "right_hand": 6},
    {"bar": 1, "beat": 2.0, "duration": 1.0, "left_hand": -6,  "right_hand": 1},
    {"bar": 1, "beat": 3.0, "duration": 1.0, "left_hand": -3,  "right_hand": 6},
    
    {"bar": 2, "beat": 1.0, "duration": 1.0, "left_hand": -10, "right_hand": 1},
    {"bar": 2, "beat": 2.0, "duration": 1.0, "left_hand": -6,  "right_hand": 6},
    {"bar": 2, "beat": 3.0, "duration": 1.0, "left_hand": -3,  "right_hand": 1},
    
    {"bar": 3, "beat": 1.0, "duration": 1.0, "left_hand": -10, "right_hand": 6},
    {"bar": 3, "beat": 2.0, "duration": 1.0, "left_hand": -6,  "right_hand": 1},
    {"bar": 3, "beat": 3.0, "duration": 1.0, "left_hand": -3,  "right_hand": -1},
    
    {"bar": 4, "beat": 1.0, "duration": 1.0, "left_hand": -10, "right_hand": -3},
    {"bar": 4, "beat": 2.0, "duration": 1.0, "left_hand": -6,  "right_hand": 1},
    {"bar": 4, "beat": 3.0, "duration": 1.0, "left_hand": -3,  "right_hand": -3}
  ]
};

const App: Component = () => {
  let out: number[] = new Array(OUT_LEN);
  let fn = new Fn();
  fn.eval(0, out);
  const lhsSamples: [ number, number, ][] =
    data.notes.map((x) => x.left_hand).map((value, index) => [ (index + 1) / 24.0, value, ] as const);
  const rhsSamples: [ number, number, ][] =
    data.notes.map((x) => x.right_hand).map((value, index) => [ (index + 1) / 24.0, value, ] as const);
  let lhsEquations = new Equations();
  for (let sample of lhsSamples) {
    fn.eval(sample[0], out);
    lhsEquations.rows.push([ ...out, sample[1], ]);
  }
  let rhsEquations = new Equations();
  for (let sample of rhsSamples) {
    fn.eval(sample[0], out);
    rhsEquations.rows.push([ ...out, sample[1], ]);
  }
  let lhsResult = lhsEquations.clone();
  lhsResult.solve();
  let rhsResult = rhsEquations.clone();
  rhsResult.solve();
  let lhsVars: number[] = new Array(OUT_LEN);
  let lhsSuccess = lhsResult.extractVars(lhsVars);
  let rhsVars: number[] = new Array(OUT_LEN);
  let rhsSuccess = rhsResult.extractVars(rhsVars);
  let mkGraphPathAndSampleMarkers = (
    samples: [ number, number, ][],
    vars: number[],
  ) => {
    let graphPath = "";
    let sampleMarkers: [ number, number, ][] = [];
    let scaleX = 800.0;
    let scaleY = 15;
    let pts: [number, number][] = [];
    for (let i = 0; i < 200; ++i) {
      let t = i / 200.0;
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
    return {
      graphPath,
      sampleMarkers,
    };
  };
  let lhsGraphPath: string | undefined = undefined;
  let lhsSampleMarkers: [ number, number, ][] = [];
  if (lhsSuccess) {
    let { graphPath, sampleMarkers, } = mkGraphPathAndSampleMarkers(lhsSamples, lhsVars);
    lhsGraphPath = graphPath;
    lhsSampleMarkers = sampleMarkers;
  }
  let rhsGraphPath: string | undefined = undefined;
  let rhsSampleMarkers: [ number, number, ][] = [];
  if (lhsSuccess) {
    let { graphPath, sampleMarkers, } = mkGraphPathAndSampleMarkers(rhsSamples, rhsVars);
    rhsGraphPath = graphPath;
    rhsSampleMarkers = sampleMarkers;
  }
  //
  let [ state, setState, ] = createStore<{
    audioCtx: AudioContext | undefined,
    audioNode: AudioWorkletNode | undefined,
  }>({
    audioCtx: undefined,
    audioNode: undefined,
  });
  setupAudio().then(({ audioCtx, audioNode }) => {
    batch(() => {
      setState("audioCtx", audioCtx);
      setState("audioNode", audioNode);
    });
  });
  document.addEventListener("click", () => {
    let audioCtx = state.audioCtx;
    if (audioCtx === undefined) {
      return;
    }
    audioCtx.resume();
    let audioNode = state.audioNode;
    if (audioNode !== undefined) {
      audioNode.port.postMessage({
        type: "setVars",
        params: {
          vars: rhsVars,
        },
      });
    }
  })
  //
  return (
    <>
      <div
        style={{
          "display": "flex",
          "gap": "20pz",
        }}
      >
        <For each={[ lhsEquations, rhsEquations ]}>
          {(equations) => (
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
          )}
        </For>
      </div>
      <hr/>
      <div
        style={{
          "display": "flex",
          "gap": "20px",
        }}
      >
        <For each={[ lhsResult, rhsResult, ]}>
          {(result) => (
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
          )}
        </For>
      </div>
      <hr/>
      <For each={[
        {
          success: lhsSuccess,
          samples: lhsSamples,
          vars: lhsVars,
          sampleMarkers: lhsSampleMarkers,
          graphPath: lhsGraphPath,
        },
        {
          success: rhsSuccess,
          samples: rhsSamples,
          vars: rhsVars,
          sampleMarkers: rhsSampleMarkers,
          graphPath: rhsGraphPath,
        },
      ]}>
        {({ success, samples, vars, sampleMarkers, graphPath }) => (
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
        )}
      </For>
      <Show when={lhsGraphPath} keyed>
        {(lhsGraphPath) => (
          <Show when={rhsGraphPath} keyed>
            {(rhsGraphPath) => (
              <svg width={400} height={400} style="margin: 20px;">
                <path
                  d={lhsGraphPath}
                  stroke="black"
                  stroke-width="2"
                  fill="none"
                />
                <path
                  d={rhsGraphPath}
                  stroke="black"
                  stroke-width="2"
                  fill="none"
                />
                <For each={[ ...lhsSampleMarkers, ...rhsSampleMarkers, ]}>
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
        )}
      </Show>
    </>
  );
};

export default App;
