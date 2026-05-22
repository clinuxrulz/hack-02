import { Fn } from "./Fn";
let fn = new Fn();

class MyAudioWorkletProcessor extends AudioWorkletProcessor {
  private frequency: number;
  private phase: number;
  private time: number = 0.0;
  private vars: number[] | undefined = undefined;

  constructor() {
    super();
    this.frequency = 440;
    this.phase = 0;
    this.port.onmessage = (e) => {
      let params = e.data.params;
      switch (e.data.type) {
        case "setVars": {
          this.time = 0.0;
          this.vars = params.vars;
          break;
        }
      }
    };
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    let output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        if (this.vars !== undefined) {
          let speed = 1.0 / 20.0;
          let ofs = 0.5 / 12.0;
          let s = (0.5 / 12.0) * 0.2;
          let note = fn.evalVars(
            Math.floor((((this.time * speed) + ofs) % 0.501) / s) * s,
            this.vars
          );
          let freq = 261.63 * Math.pow(2.0, note / 12.0);
          this.frequency = freq;
        }
        channel[i] = Math.sin(this.phase) * 0.2;
        this.phase += (2 * Math.PI * this.frequency) / sampleRate;
        if (this.phase >= 2 * Math.PI) {
          this.phase -= 2 * Math.PI;
        }
        this.time += 1.0 / sampleRate;
      }
    });
    return true;
  }
}

registerProcessor("my-audio-worklet-processor", MyAudioWorkletProcessor);
