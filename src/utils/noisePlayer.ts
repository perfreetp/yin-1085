type NoiseType = 'white' | 'pink' | 'brown';

class NoiseGenerator {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private volume = 0.3;

  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  private generateNoiseBuffer(type: NoiseType, duration: number = 2): AudioBuffer {
    const ctx = this.ensureContext();
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'white') {
        data[i] = white * 0.5;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else if (type === 'brown') {
        const lastOut = i > 0 ? data[i - 1] : 0;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        data[i] *= 3.5;
      }
    }
    return buffer;
  }

  play(type: NoiseType) {
    if (this.isPlaying) this.stop();

    const ctx = this.ensureContext();
    const buffer = this.generateNoiseBuffer(type, 3);

    this.noiseNode = ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = this.volume;

    this.noiseNode.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    this.noiseNode.start();
    this.isPlaying = true;
  }

  stop() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
      } catch (e) {}
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.isPlaying = false;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const noisePlayer = new NoiseGenerator();

export const MUSIC_TRACKS = [
  { id: 'white', name: '静夜白噪音', emoji: '🌙', type: 'white' as NoiseType, desc: '均匀柔和的沙沙声' },
  { id: 'pink', name: '暖调粉噪音', emoji: '🌆', type: 'pink' as NoiseType, desc: '像远处下雨的声音' },
  { id: 'brown', name: '深海棕噪音', emoji: '🌊', type: 'brown' as NoiseType, desc: '低沉温暖的大海声' },
];
