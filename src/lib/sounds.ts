/**
 * Futuristic Audio Synthesis Utility
 * Generates subtle UI sounds using Web Audio API
 */

class SoundSystem {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    // Smooth frequency glide for "neural" feel
    osc.frequency.exponentialRampToValueAtTime(freq * 0.9, this.ctx.currentTime + duration);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 2.5, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  /**
   * A soft, low-frequency hum for state changes
   */
  public hum() {
    this.playTone(60, 'sine', 0.5, 0.4);
    this.playTone(120, 'sine', 0.3, 0.2);
  }

  /**
   * Improved click: A crisp, layered high-frequency synapse sound
   */
  public click() {
    this.playTone(1600, 'sine', 0.05, 0.1);
    this.playTone(800, 'square', 0.03, 0.03);
  }

  /**
   * New: Sharper, varied "tap" sound for typing
   */
  public tap() {
    const freq = 1100 + Math.random() * 400;
    this.playTone(freq, 'sine', 0.06, 0.12);
    // Sub-layer for depth
    this.playTone(180, 'sine', 0.04, 0.06);
  }

  /**
   * A "data stream" notification
   */
  public blip() {
    this.playTone(523.25, 'sine', 0.15, 0.15); // C5
    setTimeout(() => {
      this.playTone(783.99, 'sine', 0.1, 0.1); // G5
      this.playTone(1046.50, 'sine', 0.15, 0.05); // C6
    }, 45);
  }
}

export const sounds = new SoundSystem();
