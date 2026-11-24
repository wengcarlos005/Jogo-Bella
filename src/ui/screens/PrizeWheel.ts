import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { assetURL } from '@/utils/asset';
import { textureURL } from '../textures';

/**
 * Roleta da Sorte do Weng — aparece no fim dos capítulos 1 e 2.
 *
 * É uma roleta "honesta" que trapaceia o tempo todo: no 1º giro cai num prêmio ridículo,
 * no 2º quase cai no prêmio e escapa no último segundo, e no 3º finalmente entrega o
 * PRÊMIO SURPRESA, que é um presente de verdade (a foto aparece no fim).
 *
 * Controles: botão / clique, espaço, Enter, E ou o botão de interagir do controle.
 */
export type PrizeWheelId = 'bolsa' | 'kitty';

type Mood = 'b-pensa' | 'b-feliz' | 'b-fogo' | 'w-malandro' | 'w-ri' | 'w-orgulho';
type Line = [Mood, string];

interface Roleta {
  slices: string[];
  intro: Line[];
  /** 1º giro: cai nesta fatia (prêmio ridículo). */
  first: { slice: number; after: Line[] };
  /** 2º giro: para no prêmio e alguma coisa estraga. */
  second: { trick: 'creep' | 'meli'; slice: number; before: Line; after: Line[] };
  /** 3º giro: o Weng "ajeita" a roleta. */
  third: { before: Line[]; meia: string };
  prize: { photo: string; title: string; text: string };
}

const PRIZE = 'PRÊMIO SURPRESA';

const ROLETAS: Record<PrizeWheelId, Roleta> = {
  bolsa: {
    slices: [PRIZE, 'Nada de nada', 'Um taco com pimenta', 'Meia furada do Weng', 'Gire de novo (mentira)', 'Massagem de 3 segundos', 'Um pombo de estimação', 'Foto 3x4 do Weng'],
    intro: [
      ['w-malandro', 'Fim do capítulo 1! E toda fase boa termina com prêmio. Apresento a Roleta da Sorte do Weng!'],
      ['b-pensa', 'Por que ela tem a sua cara desenhada no meio?'],
      ['w-orgulho', 'Porque é uma roleta de respeito. Pode girar, ela é 100% honesta.'],
    ],
    first: {
      slice: 1,
      after: [
        ['w-ri', 'NADA! Que azar, hein? Mas parabéns pela participação.'],
        ['b-fogo', 'Essa roleta tá roubada.'],
        ['w-malandro', 'Imagina. Gira de novo, vai.'],
      ],
    },
    second: {
      trick: 'creep',
      slice: 7,
      before: ['b-feliz', 'AAAA, parou no prêmio! Parou no prêmio!'],
      after: [
        ['w-orgulho', 'Uma foto 3x4 minha! Pra guardar na carteira. Pode chorar.'],
        ['b-fogo', 'WENG. A seta tava EM CIMA do prêmio.'],
        ['w-ri', 'Foi o vento.'],
        ['b-fogo', 'A gente tá dentro de casa.'],
      ],
    },
    third: {
      before: [
        ['w-malandro', 'Tá bom, tá bom. Eu dei uma ajeitadinha na roleta. Agora vai.'],
        ['b-pensa', '...Por que ainda sobrou uma meia furada?'],
        ['w-ri', 'Pra dar emoção.'],
      ],
      meia: 'Meia furada do Weng',
    },
    prize: {
      photo: 'assets/cinematics/premio-bolsa.png',
      title: 'Uma bolsinha creme com lacinho dourado',
      text: 'Esse prêmio saiu do jogo. Olha pro lado: o Weng tem uma coisa pra te entregar.',
    },
  },
  kitty: {
    slices: [PRIZE, 'Um sachê da Meli (já comido)', 'Novelo usado', 'Lavar a louça do apê', 'Uma régua de casal perfeito', 'Chocolate da Páscoa (mordido)', 'Gire de novo (mentira de novo)', 'Um abraço (esse é bom)'],
    intro: [
      ['w-malandro', 'Fim do capítulo 2! A Roleta da Sorte voltou. E agora ela é 200% honesta.'],
      ['b-pensa', 'Da última vez eu ganhei uma foto 3x4 sua.'],
      ['w-orgulho', 'E você guardou? Gira aí.'],
    ],
    first: {
      slice: 3,
      after: [
        ['w-ri', 'Lavar a louça do apê! A pia tá te esperando, amor.'],
        ['b-fogo', 'Eu não vou lavar louça de prêmio.'],
        ['w-malandro', 'Tá, tá. Mais uma.'],
      ],
    },
    second: {
      trick: 'meli',
      slice: 1,
      before: ['b-feliz', 'PRÊMIO SURPRESA! Agora eu ganhei! Ganhei mesmo!'],
      after: [
        ['w-ri', 'A Meli empurrou a roleta. Ela ganhou um sachê. Você ganhou... o pacotinho vazio.'],
        ['b-fogo', 'MELI!'],
        ['w-orgulho', 'Ela é muito competitiva. Puxou a dona.'],
      ],
    },
    third: {
      before: [
        ['w-malandro', 'Prendi a Meli no quarto e tirei quase tudo que é ruim. Último giro!'],
        ['b-pensa', 'Quase tudo?'],
        ['w-ri', 'A régua ficou. A gente não é régua de ninguém, mas ela é engraçada.'],
      ],
      meia: 'Uma régua de casal perfeito',
    },
    prize: {
      photo: 'assets/cinematics/premio-kitty.png',
      title: 'Uma Hello Kitty fantasiada de ursinho polar',
      text: 'De lacinho vermelho e tudo. É de verdade: pede pro Weng, ela tá escondida aí perto.',
    },
  },
};

const COLORS = ['#ffd36b', '#ff9fbf', '#fff1d6', '#c7b6ff', '#a9e4cf', '#ffc08a', '#fff1d6', '#9fd3ff'];
const N = 8;
const SEG = 360 / N;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const ease = (t: number) => 1 - Math.pow(1 - t, 3.2);

export function playPrizeWheel(parent: HTMLElement, id: PrizeWheelId): Promise<void> {
  const cfg = ROLETAS[id];
  const mg = (f: string) => assetURL(`assets/minigames/taco-${f}.png`);
  for (const f of ['b-pensa', 'b-feliz', 'b-fogo', 'w-malandro', 'w-ri', 'w-orgulho']) new Image().src = mg(f);
  const photoUrl = assetURL(cfg.prize.photo);
  new Image().src = photoUrl;

  return new Promise((resolve) => {
    const labels = [...cfg.slices];
    // ---------- roda (SVG) ----------
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-110 -110 220 220');
    svg.setAttribute('class', 'pw-svg');
    const rot = document.createElementNS(NS, 'g');
    svg.append(rot);
    const texts: SVGTextElement[] = [];
    const paths: SVGPathElement[] = [];
    const pt = (deg: number, r: number) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
    };
    for (let i = 0; i < N; i++) {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', `M0 0 L${pt(i * SEG, 100)} A100 100 0 0 1 ${pt((i + 1) * SEG, 100)} Z`);
      p.setAttribute('stroke', '#8a3a1e');
      p.setAttribute('stroke-width', '1.6');
      rot.append(p);
      paths.push(p);
      const t = document.createElementNS(NS, 'text');
      const mid = i * SEG + SEG / 2;
      t.setAttribute('transform', `rotate(${mid}) translate(0 -58) rotate(90)`);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'middle');
      t.setAttribute('class', 'pw-label');
      rot.append(t);
      texts.push(t);
    }
    // aro com luzinhas
    const rim = document.createElementNS(NS, 'circle');
    rim.setAttribute('r', '102');
    rim.setAttribute('class', 'pw-rim');
    svg.append(rim);
    const bulbs: SVGCircleElement[] = [];
    for (let i = 0; i < 16; i++) {
      const b = document.createElementNS(NS, 'circle');
      const [x, y] = pt(i * 22.5, 102).split(' ');
      b.setAttribute('cx', x);
      b.setAttribute('cy', y);
      b.setAttribute('r', '3.4');
      b.setAttribute('class', 'pw-bulb');
      svg.append(b);
      bulbs.push(b);
    }
    const hub = document.createElementNS(NS, 'circle');
    hub.setAttribute('r', '20');
    hub.setAttribute('class', 'pw-hub');
    svg.append(hub);
    const hubImg = document.createElementNS(NS, 'image');
    const wengUrl = textureURL('portrait-weng') ?? '';
    hubImg.setAttribute('href', wengUrl);
    hubImg.setAttribute('x', '-17');
    hubImg.setAttribute('y', '-17');
    hubImg.setAttribute('width', '34');
    hubImg.setAttribute('height', '34');
    hubImg.setAttribute('style', 'clip-path: circle(50% at 50% 50%)');
    svg.append(hubImg);

    const paint = () => {
      for (let i = 0; i < N; i++) {
        const prize = labels[i] === PRIZE;
        paths[i].setAttribute('fill', prize ? 'url(#pw-gold)' : COLORS[i]);
        texts[i].classList.toggle('prize', prize);
        // quebra em até 2 linhas
        const words = labels[i].split(' ');
        let a = '';
        let b = '';
        for (const w of words) {
          if ((a + ' ' + w).trim().length <= 13 && !b) a = (a + ' ' + w).trim();
          else b = (b + ' ' + w).trim();
        }
        texts[i].replaceChildren();
        const l1 = document.createElementNS(NS, 'tspan');
        l1.setAttribute('x', '0');
        l1.setAttribute('dy', b ? '-0.55em' : '0');
        l1.textContent = a;
        texts[i].append(l1);
        if (b) {
          const l2 = document.createElementNS(NS, 'tspan');
          l2.setAttribute('x', '0');
          l2.setAttribute('dy', '1.1em');
          l2.textContent = b;
          texts[i].append(l2);
        }
      }
    };
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML =
      '<radialGradient id="pw-gold" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse"><stop offset="0.2" stop-color="#fff3a8"/><stop offset="1" stop-color="#f2b430"/></radialGradient>';
    svg.prepend(defs);
    paint();

    // ---------- tela ----------
    const pointer = h('div', { class: 'pw-pointer' });
    const paw = h('img', { class: 'pw-paw', src: textureURL('portrait-meli') ?? '', alt: '' });
    const wheelBox = h('div', { class: 'pw-wheel' }, svg as unknown as HTMLElement, pointer, paw);
    const face = h('img', { class: 'tr-face bust pw-face', alt: '' }) as HTMLImageElement;
    const msg = h('div', { class: 'gp-bubble tr-msg pw-msg' });
    const btn = h('button', { class: 'btn primary pw-btn' }, 'Continuar') as HTMLButtonElement;
    const result = h('div', { class: 'pw-result' });
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel tr-panel pw-panel' },
      h('div', { class: 'bg-title pw-title' }, 'Roleta da Sorte do Weng'),
      h('div', { class: 'pw-sub' }, id === 'bolsa' ? 'Prêmio do fim do capítulo 1' : 'Prêmio do fim do capítulo 2'),
      wheelBox,
      result,
      h('div', { class: 'tr-talk' }, face, msg),
      h('div', { class: 'bg-actions tr-actions' }, btn),
    );
    const screen = h('div', { class: 'screen bg-screen pw-screen' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();
    requestAnimationFrame(() => screen.classList.add('show'));

    // ---------- falas e botão ----------
    let next: (() => void) | null = null;
    let lastPress = 0;
    const press = () => {
      if (btn.disabled || !next || performance.now() - lastPress < 250) return;
      lastPress = performance.now();
      AudioSystem.play('confirm');
      const n = next;
      next = null;
      n();
    };
    btn.addEventListener('click', press);
    InputSystem.on('minigame:interact', press);
    const button = (label: string) =>
      new Promise<void>((r) => {
        btn.textContent = label;
        btn.disabled = false;
        btn.classList.remove('pw-hide');
        next = r;
      });
    const say = async ([mood, text]: Line, label = 'Continuar') => {
      face.src = mg(mood);
      face.classList.remove('pop');
      void face.offsetWidth;
      face.classList.add('pop');
      msg.textContent = text;
      msg.classList.remove('pop');
      void msg.offsetWidth;
      msg.classList.add('pop');
      AudioSystem.play('blip');
      await button(label);
    };
    const talk = async (lines: Line[], last = 'Continuar') => {
      for (let i = 0; i < lines.length; i++) await say(lines[i], i === lines.length - 1 ? last : 'Continuar');
    };
    const lock = () => {
      btn.disabled = true;
      btn.classList.add('pw-hide');
    };
    const show = (text: string, good = false) => {
      result.textContent = text;
      result.className = `pw-result on${good ? ' good' : ''}`;
    };

    // ---------- giro ----------
    let angle = 0; // rotação atual (graus, horário)
    let lastTick = 0;
    const setAngle = (a: number) => {
      const tick = Math.floor(a / SEG);
      if (tick !== lastTick) {
        lastTick = tick;
        AudioSystem.play('blip');
        pointer.classList.remove('tick');
        void pointer.offsetWidth;
        pointer.classList.add('tick');
      }
      angle = a;
      rot.setAttribute('transform', `rotate(${a.toFixed(2)})`);
    };
    /** Fatia que está embaixo da seta. */
    const under = () => {
      const a = (((-angle % 360) + 360) % 360) / SEG;
      return Math.floor(a) % N;
    };
    /** Gira até a seta ficar na fatia `i` (frac 0..1 dentro da fatia, no sentido em que a roda vem). */
    const spinTo = (i: number, frac: number, turns: number, ms: number) =>
      new Promise<void>((r) => {
        const targetLocal = (i + frac) * SEG; // ângulo da roda que fica sob a seta
        const base = angle + turns * 360;
        let target = -targetLocal;
        while (target < base) target += 360;
        const from = angle;
        const t0 = performance.now();
        let lit = 0;
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          setAngle(from + (target - from) * ease(t));
          if (++lit % 4 === 0) bulbs.forEach((b, k) => b.classList.toggle('on', (k + lit / 4) % 2 < 1));
          if (t < 1) requestAnimationFrame(step);
          else r();
        };
        requestAnimationFrame(step);
      });
    const nudge = (delta: number, ms: number) =>
      new Promise<void>((r) => {
        const from = angle;
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          setAngle(from + delta * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2));
          if (t < 1) requestAnimationFrame(step);
          else r();
        };
        requestAnimationFrame(step);
      });
    /** Leva a seta pro meio da fatia i pelo caminho mais curto. */
    const center = (i: number, ms: number) => {
      const local = (((-angle % 360) + 360) % 360);
      let diff = (i + 0.5) * SEG - local;
      diff = ((diff % 360) + 540) % 360 - 180;
      return nudge(-diff, ms);
    };
    const party = () => {
      for (let k = 0; k < 46; k++) {
        const c = h('i', { class: 'ck2-confetti pw-confetti', style: `left:${Math.random() * 100}%;--h:${Math.floor(Math.random() * 360)};animation-delay:${Math.random() * 600}ms;--dx:${-60 + Math.random() * 120}px` });
        screen.append(c);
        setTimeout(() => c.remove(), 3200);
      }
    };

    void (async () => {
      await wait(350);
      lock();
      await talk(cfg.intro, 'Girar');
      lock();
      show('');

      // 1º giro: prêmio ridículo
      await spinTo(cfg.first.slice, 0.5, 5, 4200);
      show(labels[under()]);
      await talk(cfg.first.after, 'Girar de novo');
      lock();
      show('');

      // 2º giro: para no prêmio... e escapa
      if (cfg.second.trick === 'creep') {
        // para no finalzinho do prêmio e, devagar, escorrega pra fatia do lado
        await spinTo(0, 0.04, 6, 4800);
        show(PRIZE, true);
        await say(cfg.second.before, '...');
        lock();
        await wait(500);
        await nudge(SEG * 0.08, 900);
        await wait(250);
        await nudge(SEG * 0.04, 1100);
      } else {
        // para bem no meio do prêmio... e a Meli empurra a roleta
        await spinTo(0, 0.5, 6, 4800);
        show(PRIZE, true);
        await say(cfg.second.before, '...');
        lock();
        paw.classList.add('in');
        await wait(650);
        wheelBox.classList.add('bump');
        await center(cfg.second.slice, 700);
        paw.classList.remove('in');
        wheelBox.classList.remove('bump');
      }
      // garante a fatia do troll
      if (under() !== cfg.second.slice) await center(cfg.second.slice, 400);
      show(labels[under()]);
      await talk(cfg.second.after, 'Girar (último giro!)');
      lock();

      // 3º giro: o Weng "ajeita" a roleta
      show('');
      await talk(cfg.third.before, 'Girar!');
      lock();
      const meiaIdx = labels.indexOf(cfg.third.meia);
      for (let i = 0; i < N; i++) {
        if (i === meiaIdx || labels[i] === PRIZE) continue;
        labels[i] = PRIZE;
        paint();
        texts[i].classList.add('flip');
        AudioSystem.play('pickup');
        await wait(220);
      }
      // cai na única fatia ruim que sobrou...
      await spinTo(meiaIdx, 0.5, 7, 5200);
      show(labels[meiaIdx]);
      await say(['b-fogo', 'NÃO ACREDITO. Sete prêmios e caiu na única que não é!'], '...');
      lock();
      await say(['w-ri', 'Hahahaha! Calma. Olha de novo.'], 'Olhar');
      lock();
      labels[meiaIdx] = PRIZE;
      paint();
      texts[meiaIdx].classList.add('flip');
      AudioSystem.play('quest');
      show(PRIZE, true);
      await wait(700);

      // revelação: o presente de verdade
      party();
      AudioSystem.play('memory');
      const box = h('div', { class: 'pw-gift' }, h('div', { class: 'pw-gift-lid' }), h('div', { class: 'pw-gift-box' }));
      const photo = h('img', { class: 'pw-photo', src: photoUrl, alt: cfg.prize.title });
      const reveal = h(
        'div',
        { class: 'pw-reveal' },
        h('div', { class: 'pw-kicker' }, 'PRÊMIO DE VERDADE!'),
        h('div', { class: 'pw-stage' }, box, h('div', { class: 'pw-polaroid' }, photo)),
        h('div', { class: 'pw-name' }, cfg.prize.title),
        h('div', { class: 'pw-text' }, cfg.prize.text),
      );
      wheelBox.replaceWith(reveal);
      result.remove();
      requestAnimationFrame(() => reveal.classList.add('show'));
      await wait(900);
      box.classList.add('open');
      await wait(700);
      reveal.classList.add('photo');
      party();
      await say(['w-orgulho', 'Esse eu não roubei. Esse é seu de verdade.'], 'Pegar o prêmio');

      screen.classList.remove('show');
      await wait(350);
      InputSystem.off('minigame:interact', press);
      InputSystem.pop('minigame');
      screen.remove();
      resolve();
    })();
  });
}
