import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigames de Petrópolis (sprites em assets/minigames):
 *  - Formas nas Nuvens (piquenique no Quitandinha): ache a nuvem pedida entre as que passam no céu.
 *  - Corrida de Pedalinho (lago do Quitandinha): o casal pedala sozinho; você só desvia com ← →.
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
    const badge = h('div', { class: 'nv-target off' });
    const rules = h(
      'div',
      { class: 'cs-rules nv-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('nv-dragao'), alt: '' }), h('span', {}, 'Lá em cima aparece qual forma procurar: ', h('kbd', {}, 'Procure: DRAGÃO'), '. As nuvens vão passando devagar pelo céu.')),
      h('div', {}, h('img', { src: mg('nv-gato'), alt: '' }), h('span', {}, 'Clique na nuvem certa. Ou escolha com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' e confirme com ', h('kbd', {}, 'Espaço'), '.')),
      h('div', {}, h('img', { src: mg('nv-coracao'), alt: '' }), h('span', {}, 'Nuvem errada ou deixar a certa ', h('u', {}, 'passar e sumir'), ' custa 1 ♥. São 3 corações e 6 nuvens.')),
    );
    ui.stage.append(sky ? h('img', { class: 'nv-bg', src: sky, alt: '' }) : h('div'), layer, h('img', { class: 'nv-couple', src: mg('nv-deitados'), alt: '' }), h('div', { class: 'nv-grass' }), rules);
    const order = [...CLOUDS].sort(() => Math.random() - 0.5);
    const ROUNDS = 6;
    let round = 0;
    let mistakes = 0;
    let lives = 3;
    let raf = 0;
    let last = 0;
    let target = '';
    let lock = true;
    let sel = -1;
    let over = false;
    const live: { el: HTMLElement; id: string; x: number; v: number }[] = [];

    const hud = () =>
      ui.hud.replaceChildren(
        h('span', {}, `Nuvem ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`),
        badge,
        h('span', { class: 'nv-lives' }, ...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥'))),
      );
    const visible = () => live.filter((c) => c.x > -8 && c.x < 102).sort((p, q) => p.x - q.x);
    const paintSel = () => live.forEach((c, i) => c.el.classList.toggle('sel', i === sel));
    const spawnSet = () => {
      layer.replaceChildren();
      live.length = 0;
      sel = -1;
      // a nuvem certa + 3 outras, em alturas diferentes, entrando uma de cada vez pela esquerda
      const others = CLOUDS.filter((c) => c.id !== target).sort(() => Math.random() - 0.5).slice(0, 3);
      const set = [CLOUDS.find((c) => c.id === target)!, ...others].sort(() => Math.random() - 0.5);
      const v = 8 + round * 1.3;
      set.forEach((c, i) => {
        const el = h('img', { class: 'nv-cloud', src: mg(`nv-${c.id}`), alt: c.name, style: `top:${3 + i * 12}%;left:-30%` }) as HTMLImageElement;
        el.addEventListener('pointerdown', () => tap(live.findIndex((o) => o.el === el)));
        layer.append(el);
        live.push({ el, id: c.id, x: -14 - i * 19, v: v + Math.random() * 2 });
      });
    };
    const next = () => {
      if (over) return;
      if (round >= ROUNDS) return finish();
      target = order[round % order.length].id;
      const name = CLOUDS.find((c) => c.id === target)!.name;
      lock = false;
      hud();
      badge.replaceChildren('Procure: ', h('b', {}, name.toUpperCase()));
      badge.classList.remove('off', 'pop');
      void badge.offsetWidth;
      badge.classList.add('pop');
      ui.say(round % 2 ? 'weng' : 'bella', `${round % 2 ? 'E aquela ali...' : 'Olha!'} Acha a nuvem de ${name}!`);
      spawnSet();
    };
    const loseLife = (line: string) => {
      lives--;
      mistakes++;
      AudioSystem.play('cancel');
      ui.shake();
      ui.say('weng', line);
      hud();
      if (lives <= 0) {
        over = true;
        lock = true;
        setTimeout(() => finish(), 900);
        return true;
      }
      return false;
    };
    const tap = (i: number) => {
      if (lock || i < 0) return;
      const c = live[i];
      if (c.id !== target) {
        c.el.classList.add('wrong');
        setTimeout(() => c.el.classList.remove('wrong'), 400);
        loseLife(pick(['Isso aí é uma batata. Uma batata nuvem.', 'Hmm... não. Olha de novo.', 'Você tá vendo coisa, hein?']));
        return;
      }
      lock = true;
      AudioSystem.play('pickup');
      c.el.classList.add('found');
      ui.say('bella', CLOUDS.find((x) => x.id === c.id)!.line);
      round++;
      setTimeout(next, 1700);
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      for (const c of live) {
        c.x += c.v * dt;
        c.el.style.left = `${c.x}%`;
      }
      if (!lock) {
        // a certa passou e sumiu
        const tg = live.find((c) => c.id === target);
        if (tg && tg.x > 108) {
          lock = true;
          round++;
          if (!loseLife('Ih, ela passou! Foi embora com o vento...')) setTimeout(next, 1400);
        }
        // seleção pelo teclado/controle: já começa marcando a primeira nuvem que aparece (E confirma);
        // se a nuvem escolhida saiu, pula pra próxima visível
        if (sel < 0 && visible().length) {
          sel = live.indexOf(visible()[0]);
          paintSel();
        } else if (sel >= 0 && live[sel].x > 102) {
          const vs = visible();
          sel = vs.length ? live.indexOf(vs[vs.length - 1]) : -1;
          paintSel();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat || lock) return;
      const vs = visible();
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'KeyD') {
        if (!vs.length) return;
        const d = e.code === 'ArrowLeft' || e.code === 'KeyA' ? -1 : 1;
        const cur = sel >= 0 ? vs.indexOf(live[sel]) : -1;
        const ni = cur < 0 ? (d > 0 ? 0 : vs.length - 1) : Math.max(0, Math.min(vs.length - 1, cur + d));
        sel = live.indexOf(vs[ni]);
        paintSel();
        AudioSystem.play('blip');
      } else if ((e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') && sel >= 0) tap(sel);
      else return;
      e.preventDefault();
    };
    const finish = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      layer.replaceChildren();
      badge.classList.add('off');
      const won = lives > 0;
      const stars = !won ? 1 : lives === 3 ? 3 : lives === 2 ? 2 : 1;
      const cp = ui.stage.querySelector('.nv-couple') as HTMLImageElement;
      cp.src = mg('nv-sentados');
      cp.classList.add('sit');
      ui.say('bella', won ? 'Eu queria parar o tempo aqui. Nessa toalha, com você.' : 'O vento ganhou de nós hoje... mas essa toalha, com você, já é o melhor céu.');
      ui.end(stars, 'Ficar mais um pouquinho', () => resolve({ stars, mistakes }));
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Olhar pro céu');
    const start = () => {
      if (!lock || over || round) return;
      startBtn.remove();
      rules.classList.add('off');
      next();
    };
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    InputSystem.once('minigame:interact', start);
    window.addEventListener('keydown', onKey);
    hud();
    raf = requestAnimationFrame(tick);
    ui.say('bella', 'Deitados na toalha, olhando pro céu... Bora brincar de achar formas nas nuvens?');
  });
}

// ====================================================================== Corrida de Pedalinho
/**
 * Controles pensados pra controle de videogame: só o direcional (o casal pedala sozinho).
 *  - Desviar: ← → (ou A / D). No controle: direcional / analógico.
 *  - Pedalar: Espaço / E / ↑ (ou o botão PEDALAR). No controle: botão A.
 * Pedalar é no RITMO: depois de cada pedalada o ponteiro corre na barra; apertar com ele no verde
 * dá impulso forte e soma combo; no amarelo, impulso fraco; cedo demais (vermelho) trava o pedal.
 * Apertar sem parar não funciona. O cisne rosa acelera no meio da prova e no sprint final.
 */
export function playBoatGame(parent: HTMLElement): Promise<MiniResult> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'pd', 'Corrida de Pedalinho');
    const LANES = [22, 50, 78];
    const GOAL = 100;
    const BASE = 30; // velocidade normal (os dois pedalando)
    let lane = 1;
    let speed = 0;
    let dist = 0;
    let rival = 0;
    let hits = 0;
    let buoys = 0;
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
    const rules = h(
      'div',
      { class: 'cs-rules pd-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('pd-barco2'), alt: '' }), h('span', {}, 'O Weng e a Bella pedalam sozinhos. Você só guia o pedalinho com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' (são 3 faixas).')),
      h('div', {}, h('img', { src: mg('pd-vitoria'), alt: '' }), h('span', {}, 'Desvie das vitórias-régias e dos patinhos com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), '. Boia dá impulso.')),
      h('div', {}, h('img', { src: mg('pd-rosa'), alt: '' }), h('span', {}, 'Chegue no píer antes do cisne rosa. Ele não está pra brincadeira.')),
    );
    ui.stage.append(water, pier, rivalEl, boat, rules);
    const bar = h('i');
    const rbar = h('i', { class: 'rv' });
    const left = h('button', { class: 'btn pd-steer', 'aria-label': 'Esquerda' }, '◀');
    const right = h('button', { class: 'btn pd-steer', 'aria-label': 'Direita' }, '▶');
    const startBtn = h('button', { class: 'btn primary' }, 'Largada!');
    ui.actions.append(startBtn);
    const hud = () =>
      ui.hud.replaceChildren(h('span', {}, 'Até o píer'), h('div', { class: 'pd-race' }, bar, rbar), h('span', { class: 'pg-err' }, `Boias: ${buoys}`));
    hud();
    const place = () => (boat.style.left = `${LANES[lane]}%`);
    place();
    const steer = (d: number) => {
      if (!running) return;
      lane = Math.max(0, Math.min(2, lane + d));
      place();
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        // pedalam sozinhos: a velocidade volta pro normal depois de uma boia
        speed += (BASE - speed) * Math.min(1, dt * 0.8);
        boat.src = mg(Math.floor(t / 220) % 2 ? 'pd-barco' : 'pd-barco2');
        if (bump > 0) bump -= dt;
        const v = bump > 0 ? speed * 0.3 : speed;
        dist += (v * dt) / 5;
        // cisne rosa: constante no começo, arranca no meio e faz sprint no final; se ficar muito pra trás, recupera
        const gap = dist - rival;
        const rate = (rival < 35 ? 5.0 : rival < 70 ? 5.4 : 5.9) + (gap > 8 ? 0.8 : 0);
        rival += dt * rate;
        water.style.backgroundPositionY = `${dist * 40}px`;
        bar.style.width = `${Math.min(100, dist)}%`;
        rbar.style.left = `${Math.min(100, rival)}%`;
        rivalEl.style.top = `${46 - (rival - dist) * 1.6}%`;
        pier.style.top = `${-30 + Math.max(0, dist - 88) * 3}%`;
        spawnIn -= dt;
        if (spawnIn <= 0 && dist < 90) {
          spawnIn = (dist > 50 ? 0.65 : 0.85) + Math.random() * 0.7;
          const kind = pick(['pd-vitoria', 'pd-patos', 'pd-boia', 'pd-vitoria', 'pd-patos']);
          const l = Math.floor(Math.random() * 3);
          const el = h('img', { class: `pd-obj ${kind}`, src: mg(kind), alt: '', style: `left:${LANES[l]}%;top:-15%` });
          ui.stage.insertBefore(el, rivalEl);
          objs.push({ el, kind, lane: l, y: -15, hit: false });
          // de vez em quando vem uma fileira de duas, deixando só uma passagem
          if (dist > 30 && kind !== 'pd-boia' && Math.random() < 0.35) {
            const l2 = (l + 1 + Math.floor(Math.random() * 2)) % 3;
            const el2 = h('img', { class: 'pd-obj pd-vitoria', src: mg('pd-vitoria'), alt: '', style: `left:${LANES[l2]}%;top:-15%` });
            ui.stage.insertBefore(el2, rivalEl);
            objs.push({ el: el2, kind: 'pd-vitoria', lane: l2, y: -15, hit: false });
          }
        }
        for (let i = objs.length - 1; i >= 0; i--) {
          const o = objs[i];
          o.y += v * dt * 2.6 + dt * 5;
          o.el.style.top = `${o.y}%`;
          if (!o.hit && o.lane === lane && o.y > 62 && o.y < 82) {
            o.hit = true;
            if (o.kind === 'pd-boia') {
              buoys++;
              speed = Math.min(42, speed + 9);
              AudioSystem.play('pickup');
              o.el.remove();
              objs.splice(i, 1);
              hud();
              continue;
            }
            hits++;
            bump = 1;
            AudioSystem.play('cancel');
            ui.shake();
            ui.say(o.kind === 'pd-patos' ? 'bella' : 'weng', o.kind === 'pd-patos' ? 'DESVIA DOS PATINHOS! Desculpa, família pato!' : 'Enroscou na vitória-régia! Desvia, desvia!');
          }
          if (o.y > 110) {
            o.el.remove();
            objs.splice(i, 1);
          }
        }
        if (Math.floor(rival) === 36 && rate > 5.3) ui.say('bella', 'O cisne rosa acelerou! Pega as boias!');
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
      const margin = dist - rival;
      ui.say(won ? 'bella' : 'weng', won ? (margin > 8 ? 'GANHAMOS com folga! O cisne rosa nem viu a gente passar!' : 'GANHAMOS! Por um bico de cisne! Minhas pernas...') : 'O cisne rosa chegou primeiro... mas a gente chegou juntinho. Isso vale mais.');
      const stars = won ? (hits <= 1 && margin > 4 ? 3 : 2) : 1;
      ui.end(stars, 'Descer no píer', () => resolve({ stars, mistakes: hits }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || done || e.repeat) return;
      const act = e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'KeyW';
      if (!running) {
        if (act) start();
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') steer(-1);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') steer(1);
      else return;
      e.preventDefault();
    };
    const start = () => {
      if (running || done) return;
      running = true;
      rules.classList.add('off');
      speed = BASE;
      ui.actions.replaceChildren(left, right);
      ui.say('weng', 'Eu e você pedalando, e você no leme. Desvia de tudo e pega as boias!');
    };
    startBtn.addEventListener('click', start);
    left.addEventListener('pointerdown', () => steer(-1));
    right.addEventListener('pointerdown', () => steer(1));
    window.addEventListener('keydown', onKey);
    ui.say('bella', 'Corrida até o píer contra aquele cisne rosa! A gente pedala, você desvia. Bora?');
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
        const b = h('button', { class: 'cf-item', title: c.name, 'data-nav': '' }, h('img', { src: mg(`cf-${c.id}`), alt: '' }), h('span', {}, c.name)) as HTMLButtonElement;
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
