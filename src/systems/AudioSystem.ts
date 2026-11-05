import { SettingsStore } from './SaveSystem';

export type Sfx =
  | 'blip'
  | 'confirm'
  | 'cancel'
  | 'pickup'
  | 'door'
  | 'doorbell'
  | 'menu'
  | 'quest'
  | 'memory'
  | 'horn'
  | 'msg';

type Note = [freq: number, dur: number, type?: OscillatorType];

/**
 * Efeitos sonoros PROVISÓRIOS sintetizados via WebAudio (sem arquivos).
 * Quando houver SFX definitivos em public/assets/audio/sfx/<nome>.ogg,
 * o PreloadScene registra e este sistema passa a tocá-los.
 */
const SYNTH: Record<Sfx, Note[]> = {
  blip: [[880, 0.025, 'square']],
  msg: [[1320, 0.05, 'sine'], [1760, 0.1, 'sine']],
  confirm: [[660, 0.06, 'square'], [990, 0.08, 'square']],
  cancel: [[440, 0.06, 'square'], [330, 0.08, 'square']],
  pickup: [[784, 0.07, 'triangle'], [988, 0.07, 'triangle'], [1319, 0.12, 'triangle']],
  door: [[180, 0.06, 'sawtooth'], [120, 0.1, 'sawtooth']],
  doorbell: [[988, 0.35, 'sine'], [784, 0.5, 'sine']],
  menu: [[523, 0.05, 'triangle'], [784, 0.06, 'triangle']],
  quest: [[523, 0.1, 'triangle'], [659, 0.1, 'triangle'], [784, 0.1, 'triangle'], [1047, 0.25, 'triangle']],
  memory: [[659, 0.15, 'sine'], [784, 0.15, 'sine'], [988, 0.15, 'sine'], [1319, 0.4, 'sine']],
  horn: [[415, 0.12, 'square'], [0.0001, 0.06, 'square'], [415, 0.22, 'square']],
};

class AudioSystemImpl {
  private ctx: AudioContext | null = null;
  private rainNode: { src: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  /** Arquivos reais registrados pelo PreloadScene (sfx/música). */
  private files = new Map<string, HTMLAudioElement>();
  private music: HTMLAudioElement | null = null;
  private musicKey: string | null = null;

  private ac(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  registerFile(key: string, url: string): void {
    this.files.set(key, new Audio(url));
  }

  play(name: Sfx): void {
    const vol = SettingsStore.data.sfxVolume;
    if (vol <= 0) return;
    const file = this.files.get(`sfx-${name}`);
    if (file) {
      const a = file.cloneNode() as HTMLAudioElement;
      a.volume = vol;
      void a.play().catch(() => undefined);
      return;
    }
    const ac = this.ac();
    if (!ac) return;
    let t = ac.currentTime;
    for (const [freq, dur, type = 'square'] of SYNTH[name]) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur * 0.9;
    }
  }

  /** Toca música se o arquivo existir; caso contrário, silêncio. */
  playMusic(key: string): void {
    if (this.musicKey === key) return;
    this.stopMusic();
    this.musicKey = key;
    const file = this.files.get(`music-${key}`);
    if (!file) return;
    this.music = file;
    file.loop = true;
    file.volume = SettingsStore.data.musicVolume;
    void file.play().catch(() => undefined);
  }

  stopMusic(): void {
    this.music?.pause();
    this.music = null;
    this.musicKey = null;
  }

  applyVolumes(): void {
    if (this.music) this.music.volume = SettingsStore.data.musicVolume;
    if (this.rainNode) this.updateRain();
  }

  private rainOut = false;
  private rainIn = false;

  /** Chuva ambiente ao ar livre (ruído filtrado). */
  setRain(on: boolean): void {
    this.rainOut = on;
    this.updateRain();
  }

  /** Chuva ouvida de dentro de casa: abafada, grave e baixinha, com batidinhas no vidro. */
  setMuffledRain(on: boolean): void {
    this.rainIn = on;
    this.updateRain();
  }

  private updateRain(): void {
    const ac = this.ac();
    if (!ac) return;
    const want = this.rainOut ? 'out' : this.rainIn ? 'in' : null;
    if (!want) {
      if (this.rainNode) {
        this.rainNode.src.stop();
        this.rainNode = null;
      }
      return;
    }
    if (!this.rainNode) {
      const buf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
      const d = buf.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < d.length; i++) {
        // ruído rosado/marrom (mais natural) + gotinhas esparsas
        brown = (brown + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = brown * 3.2 + (Math.random() * 2 - 1) * 0.35 + (Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 1.4 : 0);
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      const gain = ac.createGain();
      src.connect(filter).connect(gain).connect(ac.destination);
      src.start();
      this.rainNode = { src, gain, filter };
    }
    const n = this.rainNode;
    const t = ac.currentTime;
    const vol = SettingsStore.data.sfxVolume;
    n.filter.frequency.setTargetAtTime(want === 'out' ? 1200 : 420, t, 0.4);
    n.filter.Q.setTargetAtTime(want === 'out' ? 0.7 : 0.4, t, 0.4);
    n.gain.gain.setTargetAtTime((want === 'out' ? 0.05 : 0.11) * vol, t, 0.4);
  }

  unlock(): void {
    this.ac();
  }
}

export const AudioSystem = new AudioSystemImpl();
