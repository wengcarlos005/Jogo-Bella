/**
 * Trilha sonora 8-bit original, tocada ao vivo pelo WebAudio (sem arquivos pra baixar).
 *
 * Cinco faixas, cada uma no CLIMA de uma das músicas favoritas do casal (melodias próprias,
 * nada copiado — é inspiração de andamento, tom e emoção):
 *   amarelo   — calorosa, céu de estrelas (título, ruas)            · clima de "Yellow"
 *   cientista — balada de piano, devagar (casas, apês, quartos)     · clima de "The Scientist"
 *   viva      — épica, bumbo de festa (parques, restaurantes, festa) · clima de "Viva la Vida"
 *   paraiso   — sonhadora, brilhante (praias)                       · clima de "Paradise"
 *   conserto  — órgão que cresce, emoção (Petrópolis, o final)      · clima de "Fix You"
 *
 * Formato: cada compasso tem 8 colcheias. Melodia: "E5 - G5 ." (nota, "-" segura, "." pausa).
 */
type Style = { wave: OscillatorType; gain: number; attack: number; release: number };
interface TrackDef {
  bpm: number;
  chords: string[]; // um acorde por compasso: "C", "Am", "Bb", "F#m"
  melody: string[]; // um compasso por linha
  lead: Style;
  arp?: { pattern: number[]; wave: OscillatorType; gain: number; octave: number }; // graus do acorde (0 raiz, 1 terça, 2 quinta, 3 oitava); -1 = pausa
  pad?: { wave: OscillatorType; gain: number; cutoff: number }; // acorde sustentado (órgão)
  bass: { steps: number[]; wave: OscillatorType; gain: number };
  drums?: string; // 8 passos: k bumbo, s caixa, h chimbal, . nada
  echo?: number; // eco (0–0.4)
}

const NOTES: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const midi = (name: string, oct: number) => 12 * (oct + 1) + NOTES[name];
const freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
function parseNote(tok: string): number | null {
  const m = /^([A-G](?:#|b)?)(\d)$/.exec(tok);
  return m ? midi(m[1], +m[2]) : null;
}
function chordNotes(ch: string, oct: number): number[] {
  const m = /^([A-G](?:#|b)?)(m?)$/.exec(ch)!;
  const r = midi(m[1], oct);
  return [r, r + (m[2] ? 3 : 4), r + 7, r + 12];
}

const TRACKS: Record<string, TrackDef> = {
  amarelo: {
    bpm: 84,
    chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'F', 'Am', 'G', 'F', 'C', 'Dm', 'F', 'G', 'G'],
    melody: [
      'E5 - - G5 E5 - D5 C5', 'D5 - - - B4 - G4 .', 'C5 - E5 - A5 - G5 E5', 'F5 - - - . . . .',
      'E5 - G5 - C6 - B5 G5', 'A5 - G5 - D5 - . .', 'F5 - E5 - D5 - C5 -', 'C5 - - - - - . .',
      'A4 - C5 - E5 - - .', 'D5 - B4 - G4 - - .', 'A4 - C5 - F5 - E5 D5', 'E5 - - - - - . .',
      'F5 - E5 - D5 - C5 -', 'A5 - G5 - F5 - E5 -', 'D5 - - - G5 - - -', 'B4 - D5 - . . . .',
    ],
    lead: { wave: 'square', gain: 0.11, attack: 0.01, release: 0.12 },
    arp: { pattern: [0, 1, 2, 1, 3, 1, 2, 1], wave: 'triangle', gain: 0.07, octave: 4 },
    bass: { steps: [0, 4], wave: 'triangle', gain: 0.2 },
    drums: 'k...s...',
    echo: 0.25,
  },
  cientista: {
    bpm: 70,
    chords: ['F', 'Am', 'Bb', 'F', 'Dm', 'C', 'Bb', 'C', 'F', 'Am', 'Bb', 'Gm', 'F', 'C', 'F', 'F'],
    melody: [
      'A4 - - C5 - - . .', 'E5 - - - D5 - C5 .', 'D5 - - F5 - - . .', 'C5 - - - - - . .',
      'A4 - C5 - D5 - - .', 'E5 - - - G5 - . .', 'F5 - - D5 - - C5 .', 'C5 - - - D5 - - .',
      'A5 - - G5 - - F5 .', 'E5 - - - C5 - . .', 'D5 - F5 - Bb5 - A5 .', 'G5 - - - - - . .',
      'F5 - - C5 - - A4 .', 'G4 - - - C5 - . .', 'A4 - - - G4 - F4 .', 'F4 - - - - - . .',
    ],
    lead: { wave: 'triangle', gain: 0.16, attack: 0.005, release: 0.4 },
    arp: { pattern: [0, 2, 3, 2, 1, 2, 3, 2], wave: 'sine', gain: 0.09, octave: 4 },
    bass: { steps: [0], wave: 'triangle', gain: 0.18 },
    echo: 0.3,
  },
  viva: {
    bpm: 132,
    chords: ['Bb', 'Eb', 'F', 'Gm', 'Bb', 'Eb', 'F', 'F', 'Gm', 'Eb', 'Bb', 'F', 'Eb', 'F', 'Bb', 'Bb'],
    melody: [
      'D5 . D5 . F5 - D5 .', 'Eb5 - G5 - F5 - Eb5 .', 'D5 . C5 . Bb4 - C5 .', 'D5 - - - . . . .',
      'D5 . D5 . F5 - Bb5 .', 'G5 - F5 - Eb5 - G5 .', 'F5 - D5 - C5 - Bb4 .', 'C5 - - - . . . .',
      'G5 - F5 - D5 - Bb4 .', 'G5 - - Eb5 - - G5 .', 'F5 - D5 - Bb4 - D5 .', 'C5 - - - F5 - - .',
      'G5 - Bb5 - G5 - Eb5 .', 'F5 - A5 - C6 - A5 .', 'Bb5 - - - F5 - D5 .', 'Bb4 - - - . . . .',
    ],
    lead: { wave: 'square', gain: 0.1, attack: 0.005, release: 0.06 },
    arp: { pattern: [0, -1, 0, -1, 1, -1, 2, -1], wave: 'square', gain: 0.06, octave: 4 },
    bass: { steps: [0, 2, 4, 6], wave: 'triangle', gain: 0.18 },
    drums: 'k.h.s.kh',
    echo: 0.12,
  },
  paraiso: {
    bpm: 96,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'Am', 'F', 'G', 'C', 'C'],
    melody: [
      'E5 - - - A5 - - G5', 'F5 - - - C5 - - .', 'E5 - - - G5 - - E5', 'D5 - - - B4 - - .',
      'C6 - - B5 A5 - - G5', 'A5 - - - F5 - - .', 'G5 - - E5 C5 - - E5', 'D5 - - - - - . .',
      'A5 - - - C6 - - .', 'B5 - - - G5 - - .', 'A5 - G5 - E5 - C5 -', 'E5 - - - - - . .',
      'F5 - - A5 - - C6 -', 'B5 - - G5 - - D5 -', 'E5 - - - G5 - - -', 'C5 - - - - - . .',
    ],
    lead: { wave: 'square', gain: 0.09, attack: 0.03, release: 0.25 },
    arp: { pattern: [0, 2, 3, 2, 1, 2, 3, 2], wave: 'triangle', gain: 0.08, octave: 5 },
    bass: { steps: [0, 3, 6], wave: 'triangle', gain: 0.17 },
    drums: 'k.h.s.h.',
    echo: 0.28,
  },
  conserto: {
    bpm: 68,
    chords: ['C', 'Em', 'Am', 'G', 'F', 'C', 'G', 'G', 'C', 'Em', 'Am', 'G', 'F', 'G', 'C', 'C'],
    melody: [
      'G4 - - - C5 - - .', 'B4 - - - G4 - - .', 'C5 - - - E5 - - D5', 'D5 - - - - - . .',
      'A4 - - - C5 - - .', 'E5 - - - G5 - - .', 'F5 - - E5 - - D5 .', 'D5 - - - - - . .',
      'G5 - - - E5 - - .', 'B5 - - - G5 - - .', 'C6 - - - A5 - - E5', 'D5 - - - - - . .',
      'F5 - - - A5 - - .', 'G5 - - - B5 - - .', 'C6 - - - G5 - E5 .', 'C5 - - - - - . .',
    ],
    lead: { wave: 'sine', gain: 0.2, attack: 0.06, release: 0.6 },
    pad: { wave: 'sawtooth', gain: 0.05, cutoff: 900 },
    bass: { steps: [0], wave: 'triangle', gain: 0.17 },
    drums: 'k.......',
    echo: 0.35,
  },
};

/** Qual faixa toca em cada lugar (pelo id do mapa). */
export function trackForMap(id: string): string {
  if (/praia|pero|japones|forte/.test(id)) return 'paraiso';
  if (/^pt-/.test(id)) return 'conserto';
  if (/parque|rota66|mexicano|onfire|quintal|multidao|acai|cinema|restaurante|varanda|niemeyer/.test(id)) return 'viva';
  if (/casa|apto|quarto|cobertura/.test(id)) return 'cientista';
  return 'amarelo';
}

class ChiptuneImpl {
  private ac: AudioContext | null = null;
  private out: GainNode | null = null;
  private timer = 0;
  private track: TrackDef | null = null;
  private name = '';
  private step = 0;
  private nextTime = 0;
  private noise: AudioBuffer | null = null;
  private volume = 0.6;

  get current(): string {
    return this.name;
  }

  play(ctx: AudioContext, name: string, volume: number): void {
    if (this.name === name && this.track) return;
    const def = TRACKS[name];
    if (!def) return;
    this.volume = volume;
    this.ac = ctx;
    const old = this.out;
    if (old) {
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      setTimeout(() => old.disconnect(), 1500);
    }
    // saída nova: volume + um eco leve
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(this.level(), ctx.currentTime + 0.05, 0.4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5200;
    out.connect(lp).connect(ctx.destination);
    if (def.echo) {
      const d = ctx.createDelay(1);
      d.delayTime.value = (60 / def.bpm) * 0.75;
      const fb = ctx.createGain();
      fb.gain.value = def.echo;
      const wet = ctx.createGain();
      wet.gain.value = def.echo;
      out.connect(d).connect(fb).connect(d);
      d.connect(wet).connect(lp);
    }
    this.out = out;
    this.track = def;
    this.name = name;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.15;
    if (!this.noise) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    if (!this.timer) this.timer = window.setInterval(() => this.schedule(), 30);
  }

  stop(): void {
    if (this.out && this.ac) {
      const o = this.out;
      o.gain.setTargetAtTime(0, this.ac.currentTime, 0.2);
      setTimeout(() => o.disconnect(), 1200);
    }
    this.out = null;
    this.track = null;
    this.name = '';
    clearInterval(this.timer);
    this.timer = 0;
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.out && this.ac) this.out.gain.setTargetAtTime(this.level(), this.ac.currentTime, 0.1);
  }

  private level(): number {
    return 0.9 * this.volume;
  }

  private schedule(): void {
    const ac = this.ac;
    const t = this.track;
    if (!ac || !t || !this.out) return;
    const dur = 60 / t.bpm / 2; // colcheia
    // aba escondida / pausa longa: não tenta "recuperar" um monte de notas atrasadas
    if (this.nextTime < ac.currentTime - 0.5) this.nextTime = ac.currentTime + 0.05;
    while (this.nextTime < ac.currentTime + 0.15) {
      this.playStep(t, this.step, this.nextTime, dur);
      this.nextTime += dur;
      this.step = (this.step + 1) % (t.chords.length * 8);
    }
  }

  private playStep(t: TrackDef, step: number, when: number, dur: number): void {
    const bar = Math.floor(step / 8);
    const s = step % 8;
    const chord = t.chords[bar % t.chords.length];
    // melodia: nota no passo, segurando os "-" seguintes
    const toks = t.melody[bar % t.melody.length].split(/\s+/);
    const tok = toks[s];
    const n = tok ? parseNote(tok) : null;
    if (n !== null) {
      let len = 1;
      while (toks[s + len] === '-') len++;
      this.tone(freq(n), when, dur * len * 0.95, t.lead.wave, t.lead.gain, t.lead.attack, t.lead.release, true);
    }
    // arpejo
    if (t.arp) {
      const deg = t.arp.pattern[s];
      if (deg >= 0) this.tone(freq(chordNotes(chord, t.arp.octave)[deg]), when, dur * 0.85, t.arp.wave, t.arp.gain, 0.005, 0.08);
    }
    // órgão: acorde sustentado no começo do compasso
    if (t.pad && s === 0) {
      for (const m of chordNotes(chord, 3).slice(0, 3)) this.tone(freq(m), when, dur * 8, t.pad.wave, t.pad.gain, 0.5, 0.6, false, t.pad.cutoff);
    }
    // baixo
    if (t.bass.steps.includes(s)) {
      const root = chordNotes(chord, 2)[s % 4 === 2 && t.bass.steps.length > 2 ? 2 : 0];
      this.tone(freq(root), when, dur * (t.bass.steps.length > 2 ? 1.6 : 3.5), t.bass.wave, t.bass.gain, 0.005, 0.1);
    }
    // bateria
    const d = t.drums?.[s];
    if (d === 'k') this.kick(when);
    else if (d === 's') this.snare(when);
    if (d === 'h' || (t.drums && t.drums.length === 8 && s % 2 === 1 && t.bpm > 90)) this.hat(when);
  }

  private tone(f: number, when: number, len: number, wave: OscillatorType, g: number, attack: number, release: number, vibrato = false, cutoff = 0): void {
    const ac = this.ac!;
    const osc = ac.createOscillator();
    osc.type = wave;
    osc.frequency.value = f;
    if (vibrato && len > 0.35) {
      const lfo = ac.createOscillator();
      const lg = ac.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.setValueAtTime(0, when);
      lg.gain.linearRampToValueAtTime(f * 0.006, when + 0.3);
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(when);
      lfo.stop(when + len + release + 0.05);
    }
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, when);
    env.gain.linearRampToValueAtTime(g, when + attack);
    env.gain.setTargetAtTime(g * 0.7, when + attack, 0.15);
    env.gain.setTargetAtTime(0.0001, when + len, release / 3);
    let node: AudioNode = osc;
    if (cutoff) {
      const f2 = ac.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = cutoff;
      osc.connect(f2);
      node = f2;
    }
    node.connect(env).connect(this.out!);
    osc.start(when);
    osc.stop(when + len + release + 0.1);
  }

  private kick(when: number): void {
    const ac = this.ac!;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.frequency.setValueAtTime(140, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + 0.12);
    g.gain.setValueAtTime(0.32, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
    osc.connect(g).connect(this.out!);
    osc.start(when);
    osc.stop(when + 0.22);
  }

  private noiseHit(when: number, type: BiquadFilterType, fq: number, g: number, len: number): void {
    const ac = this.ac!;
    const src = ac.createBufferSource();
    src.buffer = this.noise;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = fq;
    const env = ac.createGain();
    env.gain.setValueAtTime(g, when);
    env.gain.exponentialRampToValueAtTime(0.0001, when + len);
    src.connect(f).connect(env).connect(this.out!);
    src.start(when);
    src.stop(when + len + 0.02);
  }

  private snare(when: number): void {
    this.noiseHit(when, 'bandpass', 1900, 0.16, 0.14);
  }

  private hat(when: number): void {
    this.noiseHit(when, 'highpass', 7500, 0.05, 0.04);
  }
}

export const Chiptune = new ChiptuneImpl();
