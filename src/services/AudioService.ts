class AudioService {
  private ctx: AudioContext | null = null;
  private sirenOscillator: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenPlaying = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a gentle telemetry heartbeat pulse
  public playHeartbeatBlip() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio context might be blocked prior to user gesture
    }
  }

  // Play pleasant chime on successful safe check-in
  public playSafeChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    } catch {
      // Ignore audio block
    }
  }

  // Toggle industrial warble siren for Level 4/5 evacuation alerts
  public toggleSiren(enable: boolean) {
    try {
      this.initContext();
      if (!this.ctx) return;

      if (enable && !this.isSirenPlaying) {
        this.isSirenPlaying = true;
        this.sirenOscillator = this.ctx.createOscillator();
        this.sirenGain = this.ctx.createGain();

        this.sirenOscillator.type = 'sawtooth';
        
        // Warble pitch between 400Hz and 850Hz every 0.8 seconds
        const now = this.ctx.currentTime;
        this.sirenOscillator.frequency.setValueAtTime(450, now);

        for (let i = 0; i < 30; i++) {
          this.sirenOscillator.frequency.linearRampToValueAtTime(850, now + (i * 0.8) + 0.4);
          this.sirenOscillator.frequency.linearRampToValueAtTime(450, now + (i * 0.8) + 0.8);
        }

        this.sirenGain.gain.setValueAtTime(0.06, now);

        this.sirenOscillator.connect(this.sirenGain);
        this.sirenGain.connect(this.ctx.destination);

        this.sirenOscillator.start();
      } else if (!enable && this.isSirenPlaying) {
        this.isSirenPlaying = false;
        if (this.sirenOscillator) {
          this.sirenOscillator.stop();
          this.sirenOscillator.disconnect();
          this.sirenOscillator = null;
        }
      }
    } catch {
      // Ignore audio block
    }
  }
}

export const audioService = new AudioService();
