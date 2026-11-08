import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigames de Petrópolis (sprites em assets/minigames):
 *  - Formas nas Nuvens (piquenique no Quitandinha): ache a nuvem pedida entre as que passam no céu.
 *  - Corrida de Pedalinho (lago do Quitandinha): pedale (espaço / botão) e desvie com ← →.
 *  - Café da manhã (varanda do hotel): o Weng monta a bandeja de memória.
 */
export interface MiniResult {
  stars: number;
  mistakes: number;
}

const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Moldura comum: título, área de jogo, fala com retrato e botões. */
export function shell(parent: HTMLElement, cls: string, title: string) {
  const stage = h('div', { class: `pg-stage ${cls}-stage` });
  const hud = h('div', { class: 'pg-hud' });
  const face = h('img', { class: 'pg-face', alt: '' }) as HTMLImageElement;
  const msg = h('div', { class: 'gp-bubble pg-msg' });
  const actions = h('div', { class: 'bg-actions' });
  const panel = h('div', { class: `bg-panel panel gp-panel pg-panel ${cls}-panel` }, h('div', { class: `bg-title pg-title ${cls}-title` }, title), hud, stage, h('div', { class: 'pg-talk' }, face, msg), actions);
  const screen = h('div', { class: 'screen bg-screen pg-screen' }, panel);
  parent.append(screen);
  InputSystem.push('minigame');
  InputSystem.releaseAll();
  const say = (who: string, t: string) => {
    const url = textureURL(`portrait-${who}`);
    if (url) face.src = url;
    msg.textContent = t;
    msg.classList.remove('pop');
    void msg.offsetWidth;
    msg.classList.add('pop');
  };
  const shake = () => {
    stage.classList.remove('bg-shake');
    void stage.offsetWidth;
    stage.classList.add('bg-shake');
  };
  const end = (stars: number, label: string, done: () => void) => {
    AudioSystem.play('quest');
    actions.replaceChildren(
      h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
      h('button', { class: 'btn primary', onclick: close }, label),
    );
    function close() {
      InputSystem.off('minigame:interact', close);
      InputSystem.pop('minigame');
      screen.remove();
      done();
    }
    InputSystem.once('minigame:interact', close);
  };
  return { stage, hud, actions, say, shake, end, screen };
}

// ====================================================================== Formas nas Nuvens
const CLOUDS = [
  { id: 'gato', name: 'gato', line: 'É a Meli! Olha o rabinho!' },
  { id: 'burger', name: 'hambúrguer', line: 'Você só pensa em comida. (Eu também.)' },
  { id: 'coracao', name: 'coração', line: 'Um coração. Meio torto. Igual o nosso primeiro beijo na chuva.' },
  { id: 'cisne', name: 'cisne', line: 'O nosso pedalinho subiu pro céu!' },
  { id: 'dragao', name: 'dragão', line: 'Um dragão! Ele tá cuidando do castelo.' },
  { id: 'bolo', name: 'bolo de aniversário', line: 'Até o céu sabe que amanhã é seu aniversário.' },
];

export function playCloudGame(parent: HTMLElement): Promise<MiniResult> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'nv', 'Formas nas Nuvens');
    const sky = textureURL('cena-pt-ceu');
    const layer = h('div', { class: 'nv-sky' });
    ui.stage.append(sky ? h('img', { class: 'nv-bg', src: sky, alt: '' }) : h('div'), layer, h('img', { class: 'nv-couple', src: mg('nv-deitados'), alt: '' }));
    const order = [...CLOUDS].sort(() => Math.random() - 0.5);
    let round = 0;
    let mistakes = 0;
    let raf = 0;
    let last = 0;
    let target = '';
    let lock = false;
    const live: { el: HTMLElement; id: string; x: number; v: number }[] = [];
    const ROUNDS = 6;

    const hud = () => ui.hud.replaceChildren(h('span', {}, `Nuvem ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`), h('span', { class: 'pg-err' }, mistakes ? `Erros: ${mistakes}` : ''));
    const spawnSet = () => {
      layer.replaceChildren();
      live.length = 0;
      // a nuvem certa + 3 outras, espalhadas em alturas diferentes, passando devagar
      const others = CLOUDS.filter((c) => c.id !== target).sort(() => Math.random() - 0.5).slice(0, 3);
      const set = [CLOUDS.find((c) => c.id === target)!, ...others].sort(() => Math.random() - 0.5);
      set.forEach((c, i) => {
        const el = h('img', { class: 'nv-cloud', src: mg(`nv-${c.id}`), alt: c.name, style: `top:${4 + i * 13}%` }) as HTMLImageElement;
        const x = -20 - i * 22;
        el.addEventListener('pointerdown', () => tap(c.id, el));
        layer.append(el);
        live.push({ el, id: c.id, x, v: 7 + round * 1.6 + Math.random() * 3 });
      });
    };
    const next = () => {
      if (round >= ROUNDS) return finish();
      target = order[round % order.length].id;
      lock = false;
      hud();
      ui.say(round % 2 ? 'weng' : 'bella', `${round % 2 ? 'E aquela ali...' : 'Olha!'} Acha a nuvem de ${CLOUDS.find((c) => c.id === target)!.name}!`);
      spawnSet();
    };
    const tap = (id: string, el: HTMLElement) => {
      if (lock) return;
      if (id !== target) {
        mistakes++;
        AudioSystem.play('cancel');
        ui.shake();
        ui.say('weng', pick(['Isso aí é uma batata. Uma batata nuvem.', 'Hmm... não. Olha de novo.', 'Você tá vendo coisa, hein?']));
        hud();
        return;
      }
      lock = true;
      AudioSystem.play('pickup');
      el.classList.add('found');
      ui.say('bella', CLOUDS.find((c) => c.id === id)!.line);
      round++;
      setTimeout(next, 1700);
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      for (const c of live) {
        c.x += c.v * dt;
        if (c.x > 110) c.x = -30;
        c.el.style.left = `${c.x}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => {
      cancelAnimationFrame(raf);
      layer.replaceChildren();
      (ui.stage.querySelector('.nv-couple') as HTMLImageElement).src = mg('nv-sentados');
      ui.say('bella', 'Eu queria parar o tempo aqui. Nessa toalha, com você.');
      ui.end(mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1, 'Ficar mais um pouquinho', () => resolve({ stars: mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1, mistakes }));
    };
    raf = requestAnimationFrame(tick);
    ui.say('bella', 'Deitados na toalha, olhando pro céu... Bora brincar de achar formas nas nuvens?');
    setTimeout(next, 1600);
  });
}

// ====================================================================== Corrida de Pedalinho
export function playBoatGame(parent: HTMLElement): Promise<MiniResult> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'pd', 'Corrida de Pedalinho');
    const LANES = [22, 50, 78];
    const GOAL = 100;
    let lane = 1;
    let speed = 0;
    let dist = 0;
    let rival = 0;
    let hits = 0;
    let buoys = 0;
    let lastPedal: 'L' | 'R' | '' = '';
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    let spawnIn = 1.2;
    let bump = 0;
    const objs: { el: HTMLElement; kind: string; lane: number; y: number; hit: boolean }[] = [];
    const water = h('div', { class: 'pd-water' });
    const boat = h('img', { class: 'pd-boat', src: mg('pd-barco'), alt: '' }) as HTMLImageElement;
    const rivalEl = h('img', { class: 'pd-rival', src: mg('pd-rosa'), alt: '' });
    const pier = h('img', { class: 'pd-pier', src: mg('pd-pier'), alt: '' });
    ui.stage.append(water, pier, rivalEl, boat);
    const bar = h('i');
    const rbar = h('i', { class: 'rv' });
    const pedL = h('button', { class: 'btn pd-ped' }, 'Pé esquerdo (A)');
    const pedR = h('button', { class: 'btn pd-ped' }, 'Pé direito (D)');
    const left = h('button', { class: 'btn pd-steer' }, '◀');
    const right = h('button', { class: 'btn pd-steer' }, '▶');
    const startBtn = h('button', { class: 'btn primary' }, 'Largada!');
    ui.actions.append(startBtn);
    const hud = () =>
      ui.hud.replaceChildren(h('span', {}, 'Até o píer'), h('div', { class: 'pd-race' }, bar, rbar), h('span', { class: 'pg-err' }, `Boias: ${buoys}`));
    hud();
    const place = () => (boat.style.left = `${LANES[lane]}%`);
    place();
    const pedal = (f: 'L' | 'R') => {
      if (!running) return;
      // alternar os pés: mesmo pé duas vezes quase não anda
      speed = Math.min(34, speed + (f !== lastPedal ? 5.5 : 1));
      lastPedal = f;
      boat.src = mg('pd-barco2');
    };
    const steer = (d: number) => {
      if (!running) return;
      lane = Math.max(0, Math.min(2, lane + d));
      place();
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        speed = Math.max(0, speed - dt * 16);
        if (speed < 6) boat.src = mg('pd-barco');
        if (bump > 0) bump -= dt;
        const v = bump > 0 ? speed * 0.3 : speed;
        dist += (v * dt) / 9;
        rival += dt * 2.15;
        water.style.backgroundPositionY = `${dist * 40}px`;
        bar.style.width = `${Math.min(100, dist)}%`;
        rbar.style.left = `${Math.min(100, rival)}%`;
        rivalEl.style.top = `${46 - (rival - dist) * 1.6}%`;
        pier.style.top = `${-30 + Math.max(0, dist - 88) * 3}%`;
        spawnIn -= dt;
        if (spawnIn <= 0 && dist < 90) {
          spawnIn = 0.9 + Math.random() * 0.9;
          const kind = pick(['pd-vitoria', 'pd-patos', 'pd-boia', 'pd-vitoria', 'pd-boia']);
          const l = Math.floor(Math.random() * 3);
          const el = h('img', { class: `pd-obj ${kind}`, src: mg(kind), alt: '', style: `left:${LANES[l]}%;top:-15%` });
          ui.stage.insertBefore(el, rivalEl);
          objs.push({ el, kind, lane: l, y: -15, hit: false });
        }
        for (let i = objs.length - 1; i >= 0; i--) {
          const o = objs[i];
          o.y += (v * dt * 2.6) + dt * 4;
          o.el.style.top = `${o.y}%`;
          if (!o.hit && o.lane === lane && o.y > 62 && o.y < 82) {
            o.hit = true;
            if (o.kind === 'pd-boia') {
              buoys++;
              speed = Math.min(40, speed + 10);
              AudioSystem.play('pickup');
              o.el.remove();
              objs.splice(i, 1);
              hud();
              continue;
            }
            hits++;
            bump = 0.9;
            AudioSystem.play('cancel');
            ui.shake();
            ui.say(o.kind === 'pd-patos' ? 'bella' : 'weng', o.kind === 'pd-patos' ? 'DESVIA DOS PATINHOS! Desculpa, família pato!' : 'Enroscou na vitória-régia! Pedala, pedala!');
          }
          if (o.y > 110) {
            o.el.remove();
            objs.splice(i, 1);
          }
        }
        if (dist >= GOAL || rival >= GOAL) finish(dist >= GOAL);
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = (won: boolean) => {
      running = false;
      done = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      ui.actions.replaceChildren();
      ui.say(won ? 'bella' : 'weng', won ? 'GANHAMOS! O cisne rosa ficou pra trás! Minhas pernas...' : 'O cisne rosa chegou primeiro... mas a gente chegou juntinho. Isso vale mais.');
      const stars = won ? (hits <= 1 ? 3 : 2) : 1;
      ui.end(stars, 'Descer no píer', () => resolve({ stars, mistakes: hits }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || done || e.repeat) return;
      if (!running && (e.code === 'Space' || e.code === 'Enter')) return start();
      if (e.code === 'KeyA' || e.code === 'KeyZ') pedal('L');
      else if (e.code === 'KeyD' || e.code === 'KeyX') pedal('R');
      else if (e.code === 'ArrowLeft') steer(-1);
      else if (e.code === 'ArrowRight') steer(1);
    };
    const start = () => {
      if (running || done) return;
      running = true;
      ui.actions.replaceChildren(left, pedL, pedR, right);
      ui.say('weng', 'Alterna os pés: A, D, A, D! E desvia com as setas. O cisne rosa tá vindo!');
    };
    startBtn.addEventListener('click', start);
    pedL.addEventListener('pointerdown', () => pedal('L'));
    pedR.addEventListener('pointerdown', () => pedal('R'));
    left.addEventListener('pointerdown', () => steer(-1));
    right.addEventListener('pointerdown', () => steer(1));
    window.addEventListener('keydown', onKey);
    ui.say('bella', 'Corrida até o píer contra aquele cisne rosa! Pedala alternando A e D, desvia com as setas. Boia dá impulso!');
    raf = requestAnimationFrame(tick);
  });
}

// ====================================================================== Café da manhã
const CAFE = [
  { id: 'paodequeijo', name: 'Pão de queijo', love: true },
  { id: 'bolo', name: 'Bolo de fubá', love: true },
  { id: 'cafe', name: 'Café com leite', love: true },
  { id: 'geleia', name: 'Geleia de morango', love: true },
  { id: 'frutas', name: 'Salada de frutas', love: true },
  { id: 'suco', name: 'Suco de laranja', love: false },
  { id: 'ovos', name: 'Ovos mexidos', love: false },
  { id: 'mamao', name: 'Mamão', love: false },
  { id: 'croissant', name: 'Croissant', love: false },
];
const EXTRA = [
  { id: 'hortensia', name: 'Hortênsia azul' },
  { id: 'cartao', name: 'Cartãozinho' },
];

export function playBreakfastGame(parent: HTMLElement): Promise<MiniResult> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'cf', 'Café da manhã de aniversário');
    const loves = CAFE.filter((c) => c.love);
    const tray: string[] = [];
    let mistakes = 0;
    let phase: 'memo' | 'pick' | 'done' = 'memo';
    const trayEl = h('div', { class: 'cf-tray' }, h('img', { class: 'cf-tray-bg', src: mg('cf-bandeja'), alt: '' }), h('div', { class: 'cf-tray-items' }));
    const note = h('div', { class: 'cf-note' }, h('b', {}, 'O que a Bella ama:'), ...loves.map((c) => h('div', {}, h('img', { src: mg(`cf-${c.id}`), alt: '' }), c.name)));
    const shelf = h(
      'div',
      { class: 'cf-shelf' },
      ...[...CAFE, ...EXTRA].sort(() => Math.random() - 0.5).map((c) => {
        const b = h('button', { class: 'cf-item', title: c.name }, h('img', { src: mg(`cf-${c.id}`), alt: '' }), h('span', {}, c.name)) as HTMLButtonElement;
        b.addEventListener('click', () => add(c.id, b));
        return b;
      }),
    );
    ui.stage.append(note, shelf, trayEl);
    const hud = () => ui.hud.replaceChildren(h('span', {}, phase === 'memo' ? 'Decore!' : `Bandeja: ${tray.length}`), h('span', { class: 'pg-err' }, mistakes ? `Erros: ${mistakes}` : ''));
    const renderTray = () =>
      (trayEl.querySelector('.cf-tray-items') as HTMLElement).replaceChildren(...tray.map((id) => h('img', { src: mg(`cf-${id}`), alt: '' })));
    const add = (id: string, b: HTMLButtonElement) => {
      if (phase !== 'pick' || tray.includes(id)) return;
      const c = CAFE.find((x) => x.id === id);
      if (c && !c.love) {
        mistakes++;
        AudioSystem.play('cancel');
        ui.shake();
        ui.say('weng', id === 'mamao' ? '(Mamão não! Ela odeia mamão. Foco, Weng.)' : `(${c.name}? Hmm... não tava na lista.)`);
        hud();
        return;
      }
      tray.push(id);
      b.classList.add('taken');
      AudioSystem.play('pickup');
      renderTray();
      hud();
      if (!c) ui.say('weng', id === 'hortensia' ? '(Uma hortênsia azul. A cidade das hortênsias.)' : '(E um cartãozinho escrito "feliz aniversário, meu amor".)');
      if (loves.every((l) => tray.includes(l.id))) serve();
    };
    const serve = () => {
      phase = 'done';
      const extras = EXTRA.filter((e) => tray.includes(e.id)).length;
      const stars = Math.max(1, Math.min(3, (mistakes === 0 ? 2 : mistakes <= 2 ? 1 : 0) + (extras > 0 ? 1 : 0)));
      ui.say('bella', extras ? 'Café na cama, flor E cartãozinho?! Weng... eu vou chorar no pão de queijo.' : 'Tudo que eu amo, numa bandeja. Você decorou mesmo, né?');
      ui.end(stars, 'Tomar café', () => resolve({ stars, mistakes }));
    };
    ui.say('weng', '(Ela ainda tá dormindo. Café na cama: tudo que ela ama. Decora a lista!)');
    hud();
    const go = h('button', { class: 'btn primary' }, 'Decorei!');
    ui.actions.append(go);
    const startPick = () => {
      if (phase !== 'memo') return;
      phase = 'pick';
      note.classList.add('hide');
      shelf.classList.add('on');
      go.remove();
      ui.say('weng', '(Agora monta a bandeja. E se quiser, um mimo a mais...)');
      hud();
    };
    go.addEventListener('click', startPick);
    setTimeout(startPick, 6000);
  });
}
