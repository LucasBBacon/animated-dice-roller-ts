/* eslint-disable @typescript-eslint/no-explicit-any */
class DiceAudioEngine {
  private context: AudioContext | null = null;
  private clackBuffer: AudioBuffer | null = null;
  private isInitialized = false;

  public async initialize() {
    if (this.isInitialized) return;

    this.context = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();

    try {
      const response = await fetch("/audio/dice-clack.mp3");
      const arrayBuffer = await response.arrayBuffer();
      this.clackBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.isInitialized = true;
    } catch (error) {
      console.error(`[AudioEngine] Failed to load audio buffer`, error);
    }
  }

  public playClack(volume = 1.0) {
    if (!this.context || !this.clackBuffer || this.context.state === 'suspended') return;

    const source = this.context.createBufferSource();
    source.buffer = this.clackBuffer;

    source.playbackRate.value = 0.85 + Math.random() * 0.3;

    const gainNode = this.context.createGain();
    gainNode.gain.value = volume * (0.5 + Math.random() * 0.5);

    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    source.start(0);
  }

  public resumeContext() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }
}

export const audioEngine = new DiceAudioEngine();
