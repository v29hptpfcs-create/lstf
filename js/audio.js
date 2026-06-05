// ==================== 音效系统（Web Audio API合成） ====================
const SFX = {
    _ctx: null,
    _volume: 0.3,
    _muted: false,
    
    init() {
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.warn('[Audio] Web Audio API not supported');
        }
    },
    
    _ensure() {
        if (!this._ctx) this.init();
        if (this._ctx && this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
        return !!this._ctx;
    },
    
    _playTone(freq, duration, type = 'sine', volumeMul = 1) {
        if (!this._ensure() || this._muted) return;
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(this._volume * volumeMul, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    },
    
    _playChord(freqs, duration, type = 'sine', volumeMul = 0.3) {
        for (const f of freqs) this._playTone(f, duration, type, volumeMul);
    },
    
    toggle() {
        this._muted = !this._muted;
        return !this._muted;
    },
    
    // ====== 游戏音效 ======
    shoot() {
        if (!this._ensure()) return;
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(this._volume * 0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    },
    
    enemyDeath() {
        this._playTone(600, 0.1, 'sine', 0.25);
        setTimeout(() => this._playTone(400, 0.08, 'sine', 0.15), 50);
    },
    
    waveStart() {
        const now = this._ctx?.currentTime || 0;
        for (let i = 0; i < 4; i++) {
            setTimeout(() => this._playTone(300 + i * 80, 0.15, 'sine', 0.2), i * 60);
        }
    },
    
    waveComplete() {
        this._playChord([523, 659, 784], 0.3, 'sine', 0.3);
    },
    
    towerBuild() {
        this._playTone(400, 0.06, 'sine', 0.2);
        setTimeout(() => this._playTone(600, 0.08, 'sine', 0.2), 60);
    },
    
    towerUpgrade() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this._playTone(400 + i * 100, 0.08, 'sine', 0.15), i * 80);
        }
    },
    
    abilityUse() {
        [300, 500, 700, 900].forEach((f, i) => {
            setTimeout(() => this._playTone(f, 0.1, 'sine', 0.2), i * 50);
        });
    },
    
    killStrike() {
        this._playChord([400, 500, 600], 0.15, 'triangle', 0.2);
    },
    
    gameOver() {
        [400, 350, 300, 200].forEach((f, i) => {
            setTimeout(() => this._playTone(f, 0.2, 'sine', 0.25), i * 150);
        });
    },
    
    victory() {
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => this._playTone(f, 0.3, 'sine', 0.25), i * 120);
        });
    },
    
    enemyHurt() {
        this._playTone(350, 0.05, 'sine', 0.1);
    }
};
