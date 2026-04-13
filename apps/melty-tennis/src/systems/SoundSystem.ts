import { gameEvents } from "../Events";
import type { Accessor } from "solid-js";

export interface SoundEffect {
  play(): void;
}

export function createProceduralSounds(enabled: Accessor<boolean>): { dispose: () => void } {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  let disposed = false;
  let bounceBuffer: AudioBuffer | null = null;
  let racketHitBuffer: AudioBuffer | null = null;

  async function initBuffers() {
    function renderToBuffer(duration: number, renderFn: (ctx: OfflineAudioContext, dest: AudioNode) => void): Promise<AudioBuffer> {
      const sampleRate = audioContext.sampleRate;
      const length = Math.ceil(duration * sampleRate);
      const offlineCtx = new OfflineAudioContext(2, length, sampleRate);
      const dest = offlineCtx.destination;
      renderFn(offlineCtx, dest);
      return offlineCtx.startRendering();
    }

    bounceBuffer = await renderToBuffer(0.12, (ctx, dest) => {
      const now = 0;
      const duration = 0.12;

      const bufferSize = ctx.sampleRate * 0.02;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 2000;

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(180, now);
      osc1.frequency.exponentialRampToValueAtTime(80, now + duration);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(350, now);
      osc2.frequency.exponentialRampToValueAtTime(120, now + duration * 0.5);

      const oscGain1 = ctx.createGain();
      oscGain1.gain.setValueAtTime(0.6, now);
      oscGain1.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const oscGain2 = ctx.createGain();
      oscGain2.gain.setValueAtTime(0.3, now);
      oscGain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.4);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + duration);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 10;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.001;
      compressor.release.value = 0.1;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.9, now);

      noiseGain.connect(filter);
      osc1.connect(oscGain1);
      osc2.connect(oscGain2);
      oscGain1.connect(filter);
      oscGain2.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(compressor);
      compressor.connect(dest);

      noise.start(now);
      noise.stop(now + 0.02);
      osc1.start(now);
      osc1.stop(now + duration);
      osc2.start(now);
      osc2.stop(now + duration * 0.5);
    });

    racketHitBuffer = await renderToBuffer(0.2, (ctx, dest) => {
      const now = 0;
      const duration = 0.2;

      const bufferSize = ctx.sampleRate * 0.015;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 3000;
      noiseFilter.Q.value = 1;

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(250, now);
      osc1.frequency.exponentialRampToValueAtTime(100, now + duration);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(500, now);
      osc2.frequency.exponentialRampToValueAtTime(180, now + duration * 0.3);

      const osc3 = ctx.createOscillator();
      osc3.type = 'square';
      osc3.frequency.setValueAtTime(120, now);
      osc3.frequency.exponentialRampToValueAtTime(60, now + duration);

      const oscGain1 = ctx.createGain();
      oscGain1.gain.setValueAtTime(0.5, now);
      oscGain1.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const oscGain2 = ctx.createGain();
      oscGain2.gain.setValueAtTime(0.25, now);
      oscGain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.3);

      const oscGain3 = ctx.createGain();
      oscGain3.gain.setValueAtTime(0.15, now);
      oscGain3.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4000, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + duration);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 10;
      compressor.attack.value = 0.001;
      compressor.release.value = 0.08;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.8, now);

      noiseGain.connect(filter);
      osc1.connect(oscGain1);
      osc2.connect(oscGain2);
      osc3.connect(oscGain3);
      oscGain1.connect(filter);
      oscGain2.connect(filter);
      oscGain3.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(compressor);
      compressor.connect(dest);

      noise.start(now);
      noise.stop(now + 0.015);
      osc1.start(now);
      osc1.stop(now + duration);
      osc2.start(now);
      osc2.stop(now + duration * 0.3);
      osc3.start(now);
      osc3.stop(now + duration);
    });

    console.log("Procedural sounds prerendered: bounce and racket hit buffers ready");
  }

  initBuffers();

  const bounceSound: SoundEffect = {
    play: () => {
      if (disposed || !bounceBuffer) return;
      const ctx = audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const source = ctx.createBufferSource();
      source.buffer = bounceBuffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  };

  const racketHitSound: SoundEffect = {
    play: () => {
      if (disposed || !racketHitBuffer) return;
      const ctx = audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const source = ctx.createBufferSource();
      source.buffer = racketHitBuffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  };

  const bounceHandler = (data: any) => {
    if (!enabled()) return;
    bounceSound.play();
  };

  const hitHandler = (data: any) => {
    if (!enabled()) return;
    racketHitSound.play();
  };

  gameEvents.on("ballBounce", bounceHandler);
  gameEvents.on("ballHit", hitHandler);

  return {
    dispose: () => {
      disposed = true;
      gameEvents.off("ballBounce", bounceHandler);
      gameEvents.off("ballHit", hitHandler);
      audioContext.close();
    }
  };
}