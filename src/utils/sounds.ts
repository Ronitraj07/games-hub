// Sound effects using Web Audio API (no external files needed!)

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const soundEnabled = localStorage.getItem('soundEnabled');
      this.enabled = soundEnabled === null ? true : soundEnabled === 'true';
    }
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3
  ) {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error('Sound error:', error);
    }
  }

  playWin() {
    this.playTone(523.25, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(783.99, 0.15, 'sine', 0.2), 200);
    setTimeout(() => this.playTone(1046.50, 0.3, 'sine', 0.3), 300);
  }

  playLoss() {
    this.playTone(392, 0.15, 'triangle', 0.2);
    setTimeout(() => this.playTone(349.23, 0.15, 'triangle', 0.2), 100);
    setTimeout(() => this.playTone(293.66, 0.3, 'triangle', 0.3), 200);
  }

  playDraw() {
    this.playTone(440, 0.2, 'square', 0.2);
    setTimeout(() => this.playTone(440, 0.2, 'square', 0.2), 150);
  }

  playClick() {
    this.playTone(800, 0.05, 'sine', 0.15);
  }

  playCorrect() {
    this.playTone(880, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(1046.50, 0.15, 'sine', 0.25), 80);
  }

  playWrong() {
    this.playTone(200, 0.2, 'sawtooth', 0.2);
  }

  playMatch() {
    this.playTone(659.25, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(783.99, 0.15, 'sine', 0.25), 60);
  }

  playFlip() {
    this.playTone(600, 0.05, 'sine', 0.1);
  }

  playTick() {
    this.playTone(1000, 0.05, 'square', 0.1);
  }

  playTimeout() {
    this.playTone(300, 0.15, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(250, 0.15, 'sawtooth', 0.2), 100);
    setTimeout(() => this.playTone(200, 0.2, 'sawtooth', 0.25), 200);
  }

  playDrop() {
    this.playTone(400, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(300, 0.05, 'sine', 0.15), 80);
  }

  playHover() {
    this.playTone(1200, 0.03, 'sine', 0.08);
  }

  playLevelUp() {
    const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    frequencies.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 80);
    });
  }

  toggleSound() {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', this.enabled.toString());
    
    if (this.enabled) {
      this.playClick();
    }
    
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const soundManager = new SoundManager();

export const playWin = () => soundManager.playWin();
export const playLoss = () => soundManager.playLoss();
export const playDraw = () => soundManager.playDraw();
export const playClick = () => soundManager.playClick();
export const playCorrect = () => soundManager.playCorrect();
export const playWrong = () => soundManager.playWrong();
export const playMatch = () => soundManager.playMatch();
export const playFlip = () => soundManager.playFlip();
export const playTick = () => soundManager.playTick();
export const playTimeout = () => soundManager.playTimeout();
export const playDrop = () => soundManager.playDrop();
export const playHover = () => soundManager.playHover();
export const playLevelUp = () => soundManager.playLevelUp();
export const toggleSound = () => soundManager.toggleSound();
export const isSoundEnabled = () => soundManager.isEnabled();