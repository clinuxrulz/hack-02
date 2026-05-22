class MyAudioWorkletProcessor extends AudioWorkletProcessor {
  private frequency: number;
  private phase: number;

  constructor() {
    super();
    this.frequency = 440;
    this.phase = 0;
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    let output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = Math.sin(this.phase);
        this.phase += (2 * Math.PI * this.frequency) / sampleRate;
        if (this.phase >= 2 * Math.PI) {
          this.phase -= 2 * Math.PI;
        }
      }
    });
    return true;
  }
}

registerProcessor("my-audio-worklet-processor", MyAudioWorkletProcessor);
