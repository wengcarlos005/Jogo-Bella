import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { assetExists, assetURL } from '@/utils/asset';
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

/** Uma fatia: imagem (assets/minigames/roleta-<id>.png, se existir), texto curto na roda e nome completo. */
interface Slice {
  id: string;
  wheel: string;
  full: string;
}

interface Roleta {
  slices: Slice[];
  /** Fatia do presente de verdade. */
  win: number;
  intro: Line[];
  /** 1º giro: cai num prêmio muito ruim. */
  first: { slice: number; after: Line[] };
  /**
   * 2º giro: quase ganha uma coisa boa e acaba em outro prêmio muito ruim.
   * 'creep': para no comecinho de `from` e escorrega pra `slice` (= from - 1).
   * 'meli': para no meio de `from` e a pata da Meli empurra a roleta pra `slice`.
   */
  second: { trick: 'creep' | 'meli'; from: number; slice: number; before: Line; after: Line[] };
  /** 3º giro: quase para em `tease` (= win + 1)... e clica pro presente. */
  third: { before: Line[]; tease: number; teaseLine: Line; win: Line };
  prize: { photo: string; title: string; text: string };
}

const S = (id: string, wheel: string, full = wheel): Slice => ({ id, wheel, full });
const DINHEIRO = S('dinheiro', 'R$ 1.000 no Multidão', 'R$ 1.000 pra gastar no Shopping da Multidão');
const KITTY = S('kitty', 'Hello Kitty ursinho', 'A Hello Kitty de ursinho polar');

// A roda gira no sentido horário: a seta passa pelas fatias em ordem DECRESCENTE (5, 4, 3...).
const ROLETAS: Record<PrizeWheelId, Roleta> = {
  bolsa: {
    slices: [
      S('bolsa', 'Bolsinha creme', 'A bolsinha creme de lacinho'),
      S('camisinha', 'Camisinha'),
      S('colar', 'Colar'),
      S('louca', 'Lavar louça por um mês'),
      S('anel', 'Anel de noivado'),
      S('bala', 'Uma bala (só uma)'),
      KITTY,
      DINHEIRO,
      S('colher', 'Colher de pau'),
      S('paris', 'Viagem pra Paris'),
    ],
    win: 0,
    intro: [
      ['w-malandro', 'Fim do capítulo 1! E toda fase boa termina com prêmio. Apresento a Roleta da Sorte do Weng!'],
      ['b-pensa', 'Peraí. Tem anel de noivado nessa roleta?! E... camisinha?!'],
      ['w-ri', 'Tem de tudo. É uma roleta muito completa. Pode girar, ela é 100% honesta.'],
    ],
    first: {
      slice: 3,
      after: [
        ['w-ri', 'Lavar a louça por um mês! Parabéns, amor. A esponja é sua.'],
        ['b-fogo', 'Essa roleta tá roubada.'],
        ['w-malandro', 'Imagina. Tá bom, roda de novo.'],
      ],
    },
    second: {
      trick: 'creep',
      from: 6,
      slice: 5,
      before: ['b-feliz', 'A HELLO KITTY! Para aí, para aí, para aí!'],
      after: [
        ['w-orgulho', 'Uma bala! Só uma. Sabor surpresa.'],
        ['b-fogo', 'A seta TAVA na Hello Kitty.'],
        ['w-ri', 'Foi o vento. A Hello Kitty fica pra próxima.'],
        ['b-fogo', 'A gente tá dentro de casa.'],
      ],
    },
    third: {
      before: [['w-malandro', 'Tá bom, tá bom. Mais uma chance. Roda de novo.']],
      tease: 1,
      teaseLine: ['b-fogo', 'NÃO. Na camisinha não. Anda, anda, anda...'],
      win: ['b-feliz', 'A BOLSINHA! Eu ganhei a bolsinha!'],
    },
    prize: {
      photo: 'assets/cinematics/premio-bolsa.png',
      title: 'Uma bolsinha creme com lacinho dourado',
      text: 'Esse prêmio saiu do jogo. Olha pro lado: o Weng tem uma coisa pra te entregar.',
    },
  },
  kitty: {
    slices: [
      KITTY,
      S('colher', 'Colher de pau'),
      S('anel', 'Anel de noivado'),
      S('sache', 'Sachê da Meli (já comido)'),
      DINHEIRO,
      S('camisinha', 'Camisinha'),
      S('louca', 'Lavar a louça do apê'),
      S('colar', 'Colar'),
      S('paris', 'Viagem pra Paris'),
      S('carro', 'Carro 0 km'),
    ],
    win: 0,
    intro: [
      ['w-malandro', 'Fim do capítulo 2! A Roleta da Sorte voltou. E a Hello Kitty continua lá, te esperando.'],
      ['b-pensa', 'Dessa vez ela é minha. E se aparecer bala, eu vou embora.'],
      ['w-orgulho', 'Agora tem até carro 0 km. Gira aí.'],
    ],
    first: {
      slice: 6,
      after: [
        ['w-ri', 'Lavar a louça do apê! A pia agradece.'],
        ['b-fogo', 'Eu NÃO vou lavar louça de prêmio.'],
        ['w-malandro', 'Tá bom, roda de novo.'],
      ],
    },
    second: {
      trick: 'meli',
      from: 4,
      slice: 3,
      before: ['b-feliz', 'MIL REAIS NO MULTIDÃO! Eu vou comprar o shopping inteiro!'],
      after: [
        ['w-ri', 'A Meli empurrou a roleta. Ela ganhou o sachê. Você ganhou... o pacotinho vazio.'],
        ['b-fogo', 'MELI!'],
        ['w-orgulho', 'Ela é muito competitiva. Puxou a dona.'],
      ],
    },
    third: {
      before: [['w-malandro', 'Prendi a Meli no quarto. Roda de novo, última chance.']],
      tease: 1,
      teaseLine: ['b-fogo', 'A colher de pau de novo NÃO. Anda, anda...'],
      win: ['b-feliz', 'A HELLO KITTY! Finalmente! Ela é minha!'],
    },
    prize: {
      photo: 'assets/cinematics/premio-kitty.png',
      title: 'Uma Hello Kitty fantasiada de ursinho polar',
      text: 'De lacinho vermelho e tudo. É de verdade: pede pro Weng, ela tá escondida aí perto.',
    },
  },
};

const COLORS = ['#ff9fbf', '#fff1d6', '#c7b6ff', '#a9e4cf', '#ffc08a', '#9fd3ff', '#ffd36b', '#fff1d6', '#b9e98f', '#ffb3a1'];
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const ease = (t: number) => 1 - Math.pow(1 - t, 3.2);

export function playPrizeWheel(parent: HTMLElement, id: PrizeWheelId): Promise<void> {
  const cfg = ROLETAS[id];
  const N = cfg.slices.length;
  const SEG = 360 / N;
  const mg = (f: string) => assetURL(`assets/minigames/taco-${f}.png`);
  for (const f of ['b-pensa', 'b-feliz', 'b-fogo', 'w-malandro', 'w-ri', 'w-orgulho']) new Image().src = mg(f);
  const photoUrl = assetURL(cfg.prize.photo);
  new Image().src = photoUrl;

  return new Promise((resolve) => {
    const labels: Slice[] = [...cfg.slices];
    const iconUrl = (id: string) => (assetExists(`assets/minigames/roleta-${id}.png`) ? assetURL(`assets/minigames/roleta-${id}.png`) : null);
    // ---------- roda (SVG) ----------
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-110 -110 220 220');
    svg.setAttribute('class', 'pw-svg');
    const rot = document.createElementNS(NS, 'g');
    svg.append(rot);
    const texts: SVGTextElement[] = [];
    const paths: SVGPathElement[] = [];
    const icons: SVGImageElement[] = [];
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
      // a imagem do prêmio fica perto da borda, o nome mais pra dentro
      const ic = document.createElementNS(NS, 'image');
      ic.setAttribute('x', '-22');
      ic.setAttribute('y', '-22');
      ic.setAttribute('width', '44');
      ic.setAttribute('height', '44');
      ic.setAttribute('transform', `rotate(${mid}) translate(0 -64)`);
      icons.push(ic);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'middle');
      t.setAttribute('class', 'pw-label');
      rot.append(t, ic);
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
        paths[i].setAttribute('fill', COLORS[i % COLORS.length]);
        const url = iconUrl(labels[i].id);
        icons[i].setAttribute('href', url ?? '');
        icons[i].style.display = url ? '' : 'none';
        const mid = i * SEG + SEG / 2;
        texts[i].setAttribute('transform', `rotate(${mid}) translate(0 -58) rotate(90)`);
        // com imagem, a fatia é só a imagem (o nome aparece embaixo da roleta quando ela para)
        texts[i].style.display = url ? 'none' : '';
        // quebra em até 3 linhas curtas (o texto vai deitado ao longo do raio)
        const max = url ? 9 : 12;
        const lines: string[] = [];
        for (const w of labels[i].wheel.split(' ')) {
          const cur = lines[lines.length - 1];
          if (cur !== undefined && (cur + ' ' + w).length <= max) lines[lines.length - 1] = cur + ' ' + w;
          else lines.push(w);
        }
        texts[i].classList.toggle('small', !!url || lines.length > 2);
        texts[i].replaceChildren();
        lines.forEach((ln, k) => {
          const sp = document.createElementNS(NS, 'tspan');
          sp.setAttribute('x', '0');
          sp.setAttribute('dy', k === 0 ? `${-(lines.length - 1) * 0.55}em` : '1.1em');
          sp.textContent = ln;
          texts[i].append(sp);
        });
      }
    };
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML =
      '<radialGradient id="pw-gold" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse"><stop offset="0.2" stop-color="#fff3a8"/><stop offset="1" stop-color="#f2b430"/></radialGradient>';
    svg.prepend(defs);
    paint();

    // ---------- tela ----------
    const art = (id: string) => iconUrl(id);
    const aroUrl = art('aro');
    const setaUrl = art('seta');
    const pinoUrl = art('pino');
    const pataUrl = art('meli-pata');
    const espiaUrl = art('meli-espia');
    if (aroUrl) [rim, ...bulbs].forEach((el) => el.remove());
    if (pinoUrl) [hub, hubImg].forEach((el) => el.remove());
    const pointer = setaUrl ? h('img', { class: 'pw-pointer art', src: setaUrl, alt: '' }) : h('div', { class: 'pw-pointer' });
    const paw = h('img', { class: `pw-paw${pataUrl ? ' art' : ''}`, src: pataUrl ?? textureURL('portrait-meli') ?? '', alt: '' });
    const espia = espiaUrl ? h('img', { class: 'pw-espia', src: espiaUrl, alt: '' }) : null;
    const wheelBox = h(
      'div',
      { class: 'pw-wheel' },
      espia,
      svg as unknown as HTMLElement,
      aroUrl ? h('img', { class: 'pw-aro', src: aroUrl, alt: '' }) : null,
      pinoUrl ? h('img', { class: 'pw-pino', src: pinoUrl, alt: '' }) : null,
      pointer,
      paw,
    );
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
        wheelBox.classList.add('spinning');
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          setAngle(from + (target - from) * ease(t));
          if (++lit % 4 === 0) bulbs.forEach((b, k) => b.classList.toggle('on', (k + lit / 4) % 2 < 1));
          if (t < 1) requestAnimationFrame(step);
          else {
            wheelBox.classList.remove('spinning');
            r();
          }
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
      show(labels[under()].full);
      await talk(cfg.first.after, 'Girar de novo');
      lock();
      show('');

      // 2º giro: para no prêmio... e escapa
      if (cfg.second.trick === 'creep') {
        // para no finalzinho do prêmio e, devagar, escorrega pra fatia do lado
        await spinTo(cfg.second.from, 0.04, 6, 4800);
        show(labels[cfg.second.from].full, true);
        await say(cfg.second.before, '...');
        lock();
        await wait(500);
        await nudge(SEG * 0.08, 900);
        await wait(250);
        await nudge(SEG * 0.04, 1100);
      } else {
        // para bem no meio do prêmio... e a Meli empurra a roleta
        await spinTo(cfg.second.from, 0.5, 6, 4800);
        show(labels[cfg.second.from].full, true);
        await say(cfg.second.before, '...');
        lock();
        if (espia) {
          espia.classList.add('in');
          await wait(1100);
          espia.classList.remove('in');
          await wait(250);
        }
        paw.classList.add('in');
        await wait(650);
        wheelBox.classList.add('bump');
        await center(cfg.second.slice, 700);
        paw.classList.remove('in');
        wheelBox.classList.remove('bump');
      }
      // garante a fatia do troll
      if (under() !== cfg.second.slice) await center(cfg.second.slice, 400);
      show(labels[under()].full);
      await talk(cfg.second.after);
      await talk(cfg.third.before, 'Girar de novo');
      lock();
      show('');

      // 3º giro: quase para numa fatia ruim... e clica pro presente
      await spinTo(cfg.third.tease, 0.05, 7, 5600);
      show(labels[cfg.third.tease].full);
      await say(cfg.third.teaseLine, '...');
      lock();
      await wait(400);
      await nudge(SEG * 0.07, 1300);
      await wait(200);
      await center(cfg.win, 700);
      AudioSystem.play('quest');
      show(labels[cfg.win].full, true);
      await say(cfg.third.win, 'Abrir o prêmio');
      lock();

      // revelação: o presente de verdade
      party();
      AudioSystem.play('memory');
      const box = h('div', { class: 'pw-gift' }, h('div', { class: 'pw-gift-lid' }), h('div', { class: 'pw-gift-box' }));
      const photo = h('img', { class: 'pw-photo', src: photoUrl, alt: cfg.prize.title });
      const reveal = h(
        'div',
        { class: 'pw-reveal' },
        h('div', { class: 'pw-kicker' }, 'É DE VERDADE!'),
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
