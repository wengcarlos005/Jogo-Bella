import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';
import { shell, type MiniResult } from './PetroGames';
import { assetURL } from '@/utils/asset';

/** Minigames de Cabo Frio (sprites em assets/minigames/gb-* e km-*). Tudo só com teclado. */
const mg = (f: string) => assetURL(`assets/minigames/${f}.png`);
const face = (who: string) => textureURL(`portrait-${who}`) ?? '';
const NAME: Record<string, string> = { bella: 'Bella', weng: 'Weng', nathan: 'Nathan', vitoria: 'Vitória', ruan: 'Ruan', felipe: 'Felipe', puggian: 'Puggian' };
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function sb(...chips: [string, HTMLElement][]): HTMLElement {
  return h('div', { class: 'so-sb' }, ...chips.map(([l, el]) => h('div', { class: 'so-sb-chip' }, l ? h('span', {}, l) : null, el)));
}

// ====================================================================== Gatinho-Bomba
/**
 * Jogo de cartas com a turma (original): todo mundo tem cartas na mão e uma pilha no meio.
 * Na sua vez, jogue quantas cartas quiser e termine COMPRANDO uma carta da pilha.
 * Se vier o GATINHO-BOMBA: se tiver DESARMAR, ele volta pra pilha; se não, BUM, você sai.
 * Pular: termina a vez sem comprar · Espiar: vê as 3 de cima · Embaralhar · Roubar: pega uma carta do próximo.
 * Pizza e Praia não fazem nada (são só fofas). O último que sobrar ganha.
 */
type Card = 'bomba' | 'desarmar' | 'pular' | 'espiar' | 'embaralhar' | 'roubar' | 'pizza' | 'praia';
const CARD_NAME: Record<Card, string> = { bomba: 'Gatinho-Bomba', desarmar: 'Desarmar', pular: 'Pular', espiar: 'Espiar', embaralhar: 'Embaralhar', roubar: 'Roubar', pizza: 'Gato Pizza', praia: 'Gato Praia' };
const CARD_TIP: Record<Card, string> = {
  bomba: 'BUM! Sem Desarmar, você sai do jogo.',
  desarmar: 'Salva da bomba (é automático).',
  pular: 'Termina a sua vez sem comprar.',
  espiar: 'Mostra as 3 cartas de cima da pilha.',
  embaralhar: 'Embaralha a pilha.',
  roubar: 'Pega uma carta do próximo jogador.',
  pizza: 'Não faz nada. Mas é fofa.',
  praia: 'Não faz nada. Tá de férias.',
};
export function playGatinhoGame(parent: HTMLElement): Promise<MiniResult & { place: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'gb', 'Gatinho-Bomba');
    const shuffle = <T,>(a: T[]) => {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const players = ['bella', 'nathan', 'ruan', 'puggian'].map((id) => ({ id, hand: [] as Card[], out: false, el: null as HTMLElement | null }));
    const deck: Card[] = shuffle([...Array(4)].flatMap(() => ['pular', 'espiar', 'embaralhar', 'roubar', 'pizza', 'praia'] as Card[]).concat(['desarmar', 'desarmar']));
    for (const p of players) {
      p.hand.push('desarmar');
      for (let i = 0; i < 4; i++) p.hand.push(deck.pop()!);
    }
    for (let i = 0; i < players.length - 1; i++) deck.splice(Math.floor(Math.random() * (deck.length + 1)), 0, 'bomba');

    const seats = h('div', { class: 'gb-seats' });
    const pile = h('div', { class: 'gb-pile' }, h('img', { src: mg('gb-verso'), alt: '' }), h('b', { class: 'gb-count' }));
    const played = h('div', { class: 'gb-played' });
    const peek = h('div', { class: 'gb-peek' });
    const hand = h('div', { class: 'gb-hand' });
    const tip = h('div', { class: 'gb-tip' });
    const boom = h('img', { class: 'gb-boom', src: mg('gb-explosao'), alt: '' });
    const rules = h(
      'div',
      { class: 'cs-rules gb-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('gb-bomba'), alt: '' }), h('span', {}, 'Na sua vez, jogue as cartas que quiser e termine ', h('u', { class: 'g' }, 'comprando'), ' da pilha. Se vier o Gatinho-Bomba sem Desarmar: BUM, você sai!')),
      h('div', {}, h('img', { src: mg('gb-desarmar'), alt: '' }), h('span', {}, 'Escolha a carta com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' e jogue com ', h('kbd', {}, 'Espaço'), '. A última opção, ', h('b', {}, 'Comprar'), ', termina a sua vez.')),
      h('div', {}, h('img', { src: mg('gb-espiar'), alt: '' }), h('span', {}, 'Pular, Espiar, Embaralhar e Roubar te ajudam a fugir da bomba. Quem sobrar por último ganha!')),
    );
    ui.stage.append(h('div', { class: 'gb-table' }), seats, pile, played, peek, hand, tip, boom, rules);

    let turn = 0;
    let sel = 0;
    let busy = true;
    let done = false;
    let started = false;
    let knock = 0;
    const sbLeft = h('b', { class: 'so-sb-n' }, '4');
    const sbPile = h('b', { class: 'so-sb-n' }, '0');
    const sbBombs = h('b', { class: 'so-sb-n' }, '3');
    ui.hud.replaceChildren(sb(['Na mesa', sbLeft], ['Pilha', sbPile], ['Bombas', sbBombs]));

    const alive = () => players.filter((p) => !p.out);
    const paintSeats = () => {
      seats.replaceChildren(
        ...players.slice(1).map((p, i) =>
          h(
            'div',
            { class: `gb-seat s${i}` + (p.out ? ' out' : '') + (players[turn] === p ? ' turn' : '') },
            h('img', { class: 'gb-face', src: face(p.id), alt: '' }),
            h('b', {}, NAME[p.id]),
            h('div', { class: 'gb-backs' }, ...p.hand.map(() => h('img', { src: mg('gb-verso'), alt: '' }))),
          ),
        ),
      );
      (pile.querySelector('.gb-count') as HTMLElement).textContent = String(deck.length);
      sbLeft.textContent = String(alive().length);
      sbPile.textContent = String(deck.length);
      sbBombs.textContent = String(deck.filter((c) => c === 'bomba').length);
    };
    const opts = () => [...players[0].hand.map((c, i) => ({ c, i })).filter((o) => o.c !== 'desarmar' && o.c !== 'bomba'), { c: 'comprar' as const, i: -1 }];
    const paintHand = () => {
      const me = players[0];
      const o = opts();
      sel = Math.min(sel, o.length - 1);
      hand.replaceChildren(
        ...me.hand.map((c, i) => {
          const k = o.findIndex((x) => x.i === i);
          return h('div', { class: `gb-card ${c}` + (k === sel && players[turn] === me && !busy ? ' sel' : '') + (k < 0 ? ' locked' : '') }, h('img', { src: mg(`gb-${c}`), alt: '' }), h('span', {}, CARD_NAME[c]));
        }),
        h('div', { class: 'gb-card draw' + (sel === o.length - 1 && players[turn] === me && !busy ? ' sel' : '') }, h('img', { src: mg('gb-verso'), alt: '' }), h('span', {}, 'Comprar')),
      );
      const cur = o[sel];
      tip.textContent = me.out ? 'Você explodiu... agora é torcer.' : players[turn] !== me ? `Vez de ${NAME[players[turn].id]}...` : cur.c === 'comprar' ? 'Comprar uma carta e terminar a vez.' : `${CARD_NAME[cur.c]}: ${CARD_TIP[cur.c]}`;
    };
    const show = (who: string, c: Card) => {
      const el = h('div', { class: 'gb-fly' }, h('img', { src: mg(`gb-${c}`), alt: '' }), h('b', {}, `${NAME[who]}: ${CARD_NAME[c]}`));
      played.replaceChildren(el);
      AudioSystem.play('blip');
    };
    const nextTurn = () => {
      do turn = (turn + 1) % players.length;
      while (players[turn].out);
    };
    // efeito de uma carta jogada; true = a vez termina
    const apply = async (pi: number, c: Card): Promise<boolean> => {
      const p = players[pi];
      p.hand.splice(p.hand.indexOf(c), 1);
      show(p.id, c);
      if (c === 'pular') return true;
      if (c === 'embaralhar') shuffle(deck);
      if (c === 'espiar' && pi === 0) {
        peek.replaceChildren(h('b', {}, 'As próximas 3:'), ...deck.slice(-3).reverse().map((d) => h('img', { src: mg(`gb-${d}`), alt: '' })));
        peek.classList.add('on');
        setTimeout(() => peek.classList.remove('on'), 2600);
      }
      if (c === 'roubar') {
        let t = (pi + 1) % players.length;
        while (players[t].out || t === pi) t = (t + 1) % players.length;
        const vic = players[t];
        if (vic.hand.length) {
          const got = vic.hand.splice(Math.floor(Math.random() * vic.hand.length), 1)[0];
          p.hand.push(got);
          if (pi === 0) ui.say('bella', `Roubei um ${CARD_NAME[got]} do ${NAME[vic.id]}!`);
          if (t === 0) ui.say(p.id, `Valeu pelo ${CARD_NAME[got]}, Bella!`);
        }
      }
      paintSeats();
      paintHand();
      await wait(700);
      return false;
    };
    // comprar: true = sobreviveu
    const draw = async (pi: number): Promise<void> => {
      const p = players[pi];
      const c = deck.pop()!;
      if (c !== 'bomba') {
        p.hand.push(c);
        if (pi === 0) AudioSystem.play('pickup');
        return;
      }
      show(p.id, 'bomba');
      AudioSystem.play('cancel');
      ui.shake();
      await wait(600);
      if (p.hand.includes('desarmar')) {
        p.hand.splice(p.hand.indexOf('desarmar'), 1);
        deck.splice(Math.floor(Math.random() * (deck.length + 1)), 0, 'bomba');
        show(p.id, 'desarmar');
        ui.say(p.id === 'bella' ? 'weng' : p.id, p.id === 'bella' ? 'DESARMOU! Sangue frio, hein!' : ['Ufa! Desarmei!', 'Tesoura nele!', 'Hoje não, gatinho.'][Math.floor(Math.random() * 3)]);
        await wait(700);
      } else {
        p.out = true;
        knock++;
        boom.classList.remove('on');
        void boom.offsetWidth;
        boom.classList.add('on');
        ui.say(p.id === 'bella' ? 'bella' : 'weng', p.id === 'bella' ? 'BUM. Eu explodi. EU EXPLODI, WENG.' : `${NAME[p.id]} EXPLODIU! A casa inteira gritou!`);
        await wait(1000);
      }
    };
    const botTurn = async () => {
      const p = players[turn];
      await wait(800);
      // o bot fica com medo quando tem muita bomba na pilha
      const risk = deck.filter((c) => c === 'bomba').length / Math.max(1, deck.length);
      for (let k = 0; k < 2; k++) {
        const useful = p.hand.filter((c) => ['pular', 'embaralhar', 'roubar', 'espiar'].includes(c));
        if (!useful.length || Math.random() > risk * 2.2 + 0.15) break;
        const c = useful[Math.floor(Math.random() * useful.length)];
        if (await apply(turn, c)) return endTurn();
      }
      await draw(turn);
      endTurn();
    };
    const endTurn = () => {
      paintSeats();
      if (players[0].out || alive().length <= 1) return finish();
      nextTurn();
      paintSeats();
      paintHand();
      if (turn === 0) {
        busy = false;
        paintHand();
        ui.say('weng', ['Sua vez! Respira.', 'Vai, Bella. Sem medo.', 'Cuidado com a pilha...'][Math.floor(Math.random() * 3)]);
      } else void botTurn();
    };
    const choose = async () => {
      if (busy || done || turn !== 0) return;
      const o = opts()[sel];
      busy = true;
      if (o.c === 'comprar') {
        await draw(0);
        return endTurn();
      }
      const ends = await apply(0, o.c);
      if (ends) return endTurn();
      busy = false;
      paintHand();
    };
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', onKey);
      const place = players[0].out ? players.length - knock + 1 : 1;
      const stars = place === 1 ? 3 : place === 2 ? 2 : 1;
      paintHand();
      ui.say(place === 1 ? 'bella' : 'weng', place === 1 ? 'GANHEI! Todo mundo explodiu e eu fiquei! Rainha do Gatinho-Bomba!' : place === 2 ? 'Segundo lugar! Quase... o gatinho foi mais rápido.' : 'Explodiu cedo, mas foi a explosão mais fofa da noite.');
      ui.end(stars, 'Mais uma rodada? (não)', () => resolve({ stars, mistakes: 0, place }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      const c = e.code;
      if (!started && (c === 'Space' || c === 'KeyE' || c === 'Enter')) {
        e.preventDefault();
        return start();
      }
      if (busy || turn !== 0) return;
      const n = opts().length;
      if (c === 'ArrowLeft' || c === 'KeyA') sel = (sel + n - 1) % n;
      else if (c === 'ArrowRight' || c === 'KeyD') sel = (sel + 1) % n;
      else if (c === 'Space' || c === 'KeyE' || c === 'Enter') {
        e.preventDefault();
        return void choose();
      } else return;
      e.preventDefault();
      AudioSystem.play('blip');
      paintHand();
    };
    const start = () => {
      if (started) return;
      started = true;
      rules.classList.add('off');
      ui.actions.replaceChildren();
      busy = false;
      paintSeats();
      paintHand();
      ui.say('nathan', 'A Bella começa! Visita escolhe.');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Distribuir as cartas');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    paintSeats();
    paintHand();
    ui.say('ruan', 'Regra da casa: quem explodir primeiro lava a louça.');
  });
}

// ====================================================================== Travessia até a ilha
/**
 * Atravessar a pé até a ilha pela faixa de areia na água. A cada passo, escolha onde pisar
 * (← → e ↑ pra andar). Areia clarinha é seguro. Azul-escuro é FUNDO. Brilhinho = concha cortante,
 * bolhinhas = siri. O medo da Bella sobe enquanto ela pensa; segure Espaço pra apertar a mão do Weng.
 */
type Tile = 'areia' | 'fundo' | 'concha' | 'siri';
export function playTravessiaGame(parent: HTMLElement): Promise<MiniResult & { lives: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'tv2', 'Travessia até a ilha');
    const bg = textureURL('map-cf-japones-bg');
    const ROWS = 8;
    const COLS = 4;
    // cada linha tem pelo menos uma areia clarinha, e a areia segura forma um caminho (vizinha da de antes)
    const grid: Tile[][] = [];
    let safe = 1 + Math.floor(Math.random() * 2);
    for (let r = 0; r < ROWS; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < COLS; c++) {
        const x = Math.random();
        row.push(x < 0.42 ? 'fundo' : x < 0.64 ? 'concha' : x < 0.84 ? 'siri' : 'areia');
      }
      row[safe] = 'areia';
      grid.push(row);
      safe = Math.max(0, Math.min(COLS - 1, safe + [-1, 0, 1][Math.floor(Math.random() * 3)]));
    }
    const board = h('div', { class: 'tv2-board' });
    const cells: HTMLElement[][] = grid.map((row, r) =>
      row.map((t, c) => {
        const el = h('div', { class: `tv2-cell ${t}`, style: `grid-row:${ROWS - r};grid-column:${c + 1}` }, h('i', {}));
        board.append(el);
        return el;
      }),
    );
    const couple = h('div', { class: 'tv2-me' }, h('img', { src: textureURL('portrait-bella-praia') ?? textureURL('portrait-bella') ?? '', alt: '' }), h('img', { src: textureURL('portrait-weng-praia') ?? textureURL('portrait-weng') ?? '', alt: '' }), h('i', { class: 'tv2-hand' }, '♥'));
    const island = h('div', { class: 'tv2-island' }, 'ILHA');
    const beach = h('div', { class: 'tv2-beach' }, 'PRAIA');
    const fx = h('div', { class: 'fr-fx' });
    const rules = h(
      'div',
      { class: 'cs-rules tv2-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('span', { class: 'tv2-ico areia' }), h('span', {}, 'Escolha a próxima pedra com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' e pise com ', h('kbd', {}, '↑'), '. ', h('u', { class: 'g' }, 'Areia clarinha'), ' é seguro.')),
      h('div', {}, h('span', { class: 'tv2-ico fundo' }), h('span', {}, 'Azul-escuro é FUNDO. Brilhinho é concha cortante e bolhinhas é siri! Errou: perde 1 ♥ (são 3).')),
      h('div', {}, h('span', { class: 'tv2-ico' }, '♥'), h('span', {}, 'O medo da Bella sobe enquanto ela pensa. Segure ', h('kbd', {}, 'Espaço'), ' pra apertar a mão do Weng e acalmar.')),
    );
    ui.stage.append(h('div', { class: 'tv2-bg', style: bg ? `background-image:url(${bg})` : '' }), island, board, beach, couple, fx, rules);

    let row = -1;
    let col = 1;
    let aim = 1;
    let lives = 3;
    let fear = 20;
    let hold = false;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    const sbF = h('i', {});
    const sbR = h('b', { class: 'so-sb-n' }, `0/${ROWS}`);
    const sbL = h('div', { class: 'tp-sb-lives' });
    ui.hud.replaceChildren(h('div', { class: 'so-sb' }, h('div', { class: 'so-sb-chip' }, h('span', {}, 'Passos'), sbR), h('div', { class: 'so-sb-burn' }, h('span', { class: 'lbl' }, 'Medo'), h('div', { class: 'so-sb-bar' }, sbF)), h('div', { class: 'so-sb-chip' }, sbL)));
    const hud = () => {
      sbR.textContent = `${Math.max(0, row + 1)}/${ROWS}`;
      sbF.style.width = `${fear}%`;
      sbF.className = fear > 70 ? 'hot' : fear > 40 ? 'warm' : '';
      sbL.replaceChildren(...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥')));
    };
    const place = () => {
      // posição do casal: na linha atual (ou na praia), na coluna atual
      const cell = row >= 0 ? cells[row][col] : null;
      const sbx = board.getBoundingClientRect();
      const st = ui.stage.getBoundingClientRect();
      const colW = sbx.width / COLS;
      const rowH = sbx.height / ROWS;
      const x = sbx.left - st.left + colW * (col + 0.5);
      const y = cell ? sbx.top - st.top + rowH * (ROWS - row - 0.5) : sbx.bottom - st.top + rowH * 0.5;
      couple.style.left = `${x}px`;
      couple.style.top = `${y}px`;
      cells.forEach((rr, r) => rr.forEach((el, c) => el.classList.toggle('aim', r === row + 1 && c === aim && running)));
    };
    const pop = (text: string, cls: string) => {
      const el = h('b', { class: `fr-pop ${cls}`, style: `left:${couple.style.left};top:${couple.style.top}` }, text);
      fx.append(el);
      setTimeout(() => el.remove(), 900);
    };
    const step = () => {
      if (!running) return;
      const r = row + 1;
      const t = grid[r][aim];
      cells[r][aim].classList.add('seen');
      if (t === 'areia') {
        row = r;
        col = aim;
        fear = Math.max(0, fear - 12);
        AudioSystem.play('pickup');
        pop(['Ufa!', 'Areia!', 'Firme!'][Math.floor(Math.random() * 3)], 'good');
        if (row === 2) ui.say('weng', 'Tá vendo? Areia firminha. Pisa onde eu piso.');
        if (row === 5) ui.say('bella', 'Tá ficando fundo... Weng, tá ficando FUNDO?');
        if (row >= ROWS - 1) return finish(true);
      } else {
        lives--;
        fear = Math.min(100, fear + 25);
        ui.shake();
        AudioSystem.play('cancel');
        pop(t === 'fundo' ? 'FUNDO!' : t === 'concha' ? 'Concha!' : 'SIRI!', 'bad');
        ui.say('bella', t === 'fundo' ? 'AAAH, afundou! Tá na cintura! Volta, volta!' : t === 'concha' ? 'Ai! Uma concha! Meu pé!' : 'UM SIRI! Ele me olhou! Ele OLHOU pra mim!');
        couple.classList.add('hit');
        setTimeout(() => couple.classList.remove('hit'), 500);
        if (lives <= 0) return finish(false);
      }
      hud();
      place();
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        fear = Math.max(0, Math.min(100, fear + (hold ? -14 : 4 + row * 0.6) * dt));
        couple.classList.toggle('scared', fear > 70);
        couple.classList.toggle('holding', hold);
        if (fear >= 100) {
          lives--;
          fear = 55;
          ui.shake();
          ui.say('bella', 'Eu travei! Não consigo andar! Segura minha mão!');
          if (lives <= 0) return finish(false);
        }
        hud();
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = (won: boolean) => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      hud();
      place();
      const stars = !won ? 1 : lives === 3 ? 3 : 2;
      ui.say(won ? 'bella' : 'weng', won ? 'CHEGAMOS NA ILHA! Eu atravessei! Sem desmaiar! (Quase.)' : 'Tá tudo bem, eu te carrego no colo o resto do caminho.');
      ui.end(stars, 'Subir na ilha', () => resolve({ stars, mistakes: 3 - lives, lives }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame') return;
      const c = e.code;
      if (c === 'Space' || c === 'KeyE' || c === 'Enter') {
        e.preventDefault();
        if (!running && !done && !e.repeat) return start();
        hold = true;
        return;
      }
      if (!running || e.repeat) return;
      if (c === 'ArrowLeft' || c === 'KeyA') aim = Math.max(0, aim - 1);
      else if (c === 'ArrowRight' || c === 'KeyD') aim = Math.min(COLS - 1, aim + 1);
      else if (c === 'ArrowUp' || c === 'KeyW') return step();
      else return;
      e.preventDefault();
      AudioSystem.play('blip');
      place();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') hold = false;
    };
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren();
      ui.say('weng', 'Pisa onde a areia tá clarinha. Eu tô do seu lado o tempo todo.');
      place();
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Dar a mão pro Weng');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    hud();
    requestAnimationFrame(() => place());
    ui.say('bella', 'Weng... e se tiver fundo? E se tiver bicho? E se tiver um BICHO no FUNDO?');
    raf = requestAnimationFrame(tick);
  });
}

// ====================================================================== Altinha
/**
 * Altinha na Praia do Peró com a turma em roda. A bola vem pra Bella: aperte Espaço / E quando ela
 * cair no círculo (o anel fecha). Antes de chutar, escolha pra quem passar com ← →: quem tá chamando
 * ("Aqui!") vale o dobro. Deixou cair: a roda recomeça (perde 1 ♥, são 3). Meta: 20 toques.
 */
export function playAltinhaGame(parent: HTMLElement): Promise<MiniResult & { best: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'al', 'Altinha no Peró');
    const bg = textureURL('map-cf-pero-bg');
    const GOAL = 20;
    const ring = ['weng', 'nathan', 'vitoria', 'ruan', 'felipe', 'puggian'];
    // posições em volta (a Bella embaixo, no meio)
    const POS = [
      { x: 22, y: 62 },
      { x: 18, y: 34 },
      { x: 38, y: 18 },
      { x: 62, y: 18 },
      { x: 82, y: 34 },
      { x: 78, y: 62 },
    ];
    const ME = { x: 50, y: 78 };
    const pals = ring.map((id, i) => h('div', { class: 'al-pal', style: `left:${POS[i].x}%;top:${POS[i].y}%` }, h('img', { src: face(id), alt: '' }), h('b', {}, NAME[id]), h('i', { class: 'al-call' }, 'Aqui!')));
    const meImg = h('img', { class: 'al-bella', src: mg('al-b2'), alt: '' }) as HTMLImageElement;
    const me = h('div', { class: 'al-pal me', style: `left:${ME.x}%;top:${ME.y}%` }, meImg);
    const ball = h('div', { class: 'al-ball' }, h('img', { src: mg('al-bola'), alt: '' }));
    const shadow = h('i', { class: 'al-shadow' });
    const target = h('div', { class: 'al-target', style: `left:${ME.x}%;top:${ME.y - 6}%` }, h('i', {}));
    const aimLine = h('div', { class: 'al-aim' });
    const fx = h('div', { class: 'fr-fx' });
    const rules = h(
      'div',
      { class: 'cs-rules al-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('span', { class: 'al-ico' }), h('span', {}, 'A bola vem pra Bella: aperte ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), ' quando o anel fechar no ', h('u', { class: 'g' }, 'verde'), '.')),
      h('div', {}, h('span', { class: 'al-ico call' }, '!'), h('span', {}, 'Antes, escolha pra quem passar com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), '. Quem tá gritando "Aqui!" vale o dobro.')),
      h('div', {}, h('span', { class: 'al-ico' }), h('span', {}, `Deixou cair: perde 1 ♥ (são 3). Meta: ${GOAL} toques seguidos da roda!`)),
    );
    ui.stage.append(h('div', { class: 'al-bg', style: bg ? `background-image:url(${bg})` : '' }), ...pals, me, aimLine, target, shadow, ball, fx, rules);

    let aim = 0;
    let caller = 2;
    let from = { x: 50, y: 30 };
    let to = ME;
    let t = 0;
    let dur = 1.2;
    let toMe = true;
    let touches = 0;
    let best = 0;
    let points = 0;
    let lives = 3;
    let kicked = false;
    let wait2 = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    const sbT = h('b', { class: 'so-sb-n' }, '0');
    const sbP = h('b', { class: 'so-sb-n' }, '0');
    const sbL = h('div', { class: 'tp-sb-lives' });
    ui.hud.replaceChildren(h('div', { class: 'so-sb' }, h('div', { class: 'so-sb-chip' }, h('span', {}, 'Toques'), sbT), h('div', { class: 'so-sb-chip' }, h('span', {}, 'Pontos'), sbP), h('div', { class: 'so-sb-chip' }, sbL)));
    const hud = () => {
      sbT.textContent = String(touches);
      sbP.textContent = String(points);
      sbL.replaceChildren(...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥')));
      pals.forEach((p, i) => {
        p.classList.toggle('aim', i === aim);
        p.classList.toggle('calling', i === caller);
      });
      const a = POS[aim];
      const dx = a.x - ME.x;
      const dy = a.y - ME.y;
      aimLine.style.left = `${ME.x}%`;
      aimLine.style.top = `${ME.y}%`;
      aimLine.style.width = `${Math.hypot(dx, dy * 0.6)}%`;
      aimLine.style.transform = `rotate(${Math.atan2(dy * 0.6, dx)}rad)`;
    };
    const pop = (x: number, y: number, text: string, cls: string) => {
      const el = h('b', { class: `fr-pop ${cls}`, style: `left:${x}%;top:${y}%` }, text);
      fx.append(el);
      setTimeout(() => el.remove(), 900);
    };
    const launch = (a: { x: number; y: number }, b: { x: number; y: number }, d: number, mine: boolean) => {
      from = a;
      to = b;
      t = 0;
      dur = d;
      toMe = mine;
      kicked = false;
    };
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (running) {
        if (wait2 > 0) {
          wait2 -= dt;
          if (wait2 <= 0) {
            ball.style.visibility = '';
            const k = Math.floor(Math.random() * ring.length);
            launch(POS[k], ME, 1.3, true);
          }
        } else {
          t += dt / dur;
          if (!toMe && t >= 1) {
            // o amigo devolve (às vezes pra outro amigo antes, pra dar ritmo)
            const k = ring.findIndex((_, i) => POS[i] === to);
            touches++;
            best = Math.max(best, touches);
            pals[k].classList.add('kick');
            setTimeout(() => pals[k].classList.remove('kick'), 250);
            AudioSystem.play('blip');
            caller = (k + 1 + Math.floor(Math.random() * (ring.length - 1))) % ring.length;
            if (Math.random() < 0.35 && touches > 3) {
              const j = (k + 2 + Math.floor(Math.random() * 3)) % ring.length;
              touches++;
              launch(POS[k], POS[j], Math.max(0.55, 0.9 - touches * 0.012), false);
            } else launch(POS[k], ME, Math.max(0.7, 1.3 - touches * 0.022), true);
            hud();
            if (touches >= GOAL) return finish();
          } else if (toMe && t >= 1.12) {
            lives--;
            ui.shake();
            AudioSystem.play('cancel');
            pop(ME.x, ME.y - 10, 'Caiu!', 'bad');
            const sp = h('img', { class: 'al-puff', src: mg('al-areia'), alt: '', style: `left:${ME.x + 4}%;top:${ME.y + 6}%` });
            fx.append(sp);
            setTimeout(() => sp.remove(), 800);
            ui.say(ring[Math.floor(Math.random() * ring.length)], ['Ihh, caiu! Recomeça!', 'Bella, a bola é redonda, não precisa ter medo!', 'Tudo bem, tudo bem. De novo!'][Math.floor(Math.random() * 3)]);
            touches = 0;
            ball.style.visibility = 'hidden';
            hud();
            if (lives <= 0) return finish();
            wait2 = 1.1;
          }
        }
        const k = Math.min(1.12, t);
        const x = from.x + (to.x - from.x) * Math.min(1, k);
        const yb = from.y + (to.y - from.y) * Math.min(1, k) - 6;
        const hgt = Math.sin(Math.PI * Math.min(1, k)) * 34;
        ball.style.left = `${x}%`;
        ball.style.top = `${yb - hgt}%`;
        shadow.style.left = `${x}%`;
        shadow.style.top = `${yb + 4}%`;
        shadow.style.setProperty('--s', String(Math.max(0.3, 1 - hgt / 40)));
        target.classList.toggle('on', toMe && wait2 <= 0);
        target.style.setProperty('--k', String(Math.max(0, 1 - Math.max(0, t - 0.45) / 0.5)));
        target.classList.toggle('good', toMe && t > 0.86 && t < 1.06);
      }
      raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!running || !toMe || kicked || wait2 > 0) return;
      kicked = true;
      if (t > 0.82 && t < 1.08) {
        const perfect = t > 0.9 && t < 1.02;
        const dbl = aim === caller;
        const g = (perfect ? 2 : 1) * (dbl ? 2 : 1);
        points += g;
        touches++;
        best = Math.max(best, touches);
        AudioSystem.play(perfect ? 'quest' : 'pickup');
        pop(ME.x, ME.y - 12, `${perfect ? 'PERFEITO' : 'Boa'}${dbl ? ' · pro ' + NAME[ring[aim]] + '!' : ''} +${g}`, perfect ? 'perfect' : 'good');
        meImg.src = mg('al-b1');
        setTimeout(() => (meImg.src = mg('al-b2')), 180);
        setTimeout(() => (meImg.src = mg('al-b2')), 600);
        if (touches === 10) ui.say('weng', 'DEZ! A roda tá pegando fogo!');
        launch(ME, POS[aim], Math.max(0.6, 1.0 - touches * 0.015), false);
        hud();
        if (touches >= GOAL) return finish();
      } else {
        pop(ME.x, ME.y - 12, t < 0.82 ? 'Cedo!' : 'Tarde!', 'meh');
      }
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      hud();
      const stars = best >= GOAL ? 3 : best >= 10 ? 2 : 1;
      ui.say(stars === 3 ? 'nathan' : 'bella', stars === 3 ? 'VINTE TOQUES! A Bella é a craque da roda!' : `Recorde de ${best} toques. Amanhã a gente bate os vinte!`);
      ui.end(stars, 'Cair no mar', () => resolve({ stars, mistakes: 3 - lives, best }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      const c = e.code;
      if (c === 'Space' || c === 'KeyE' || c === 'Enter') {
        e.preventDefault();
        if (!running && !done) return start();
        return kick();
      }
      if (!running) return;
      if (c === 'ArrowLeft' || c === 'KeyA') aim = (aim + ring.length - 1) % ring.length;
      else if (c === 'ArrowRight' || c === 'KeyD') aim = (aim + 1) % ring.length;
      else return;
      e.preventDefault();
      hud();
    };
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren();
      ui.say('felipe', 'Roda formada! Bella, lá vai!');
      launch(POS[2], ME, 1.4, true);
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Entrar na roda');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    hud();
    ui.say('puggian', 'Altinha! Regra: deixou cair, paga o açaí da turma.');
    raf = requestAnimationFrame(tick);
  });
}

// ====================================================================== 5 km até a virada
/**
 * Nenhum Uber aceitou: a turma vai a pé até a Praia do Forte. O casal anda pela calçada de noite
 * (a tela corre sozinha). Pule os obstáculos com Espaço / E (poça, cone, buraco, chinelo) e passe
 * devagar pelo cachorro dormindo segurando ↓. Cada tropeço custa tempo. No km 3 vem a carona!
 */
type Obs = { el: HTMLElement; x: number; kind: string; done: boolean };
export function playCincoKmGame(parent: HTMLElement): Promise<MiniResult & { left: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'km', '5 km até a virada');
    const sky = h('div', { class: 'km-sky' });
    const city = h('div', { class: 'km-city' });
    const lamps = h('div', { class: 'km-lamps' });
    const road = h('div', { class: 'km-road' }, h('i', { class: 'km-lines' }));
    const walk = h('img', { class: 'km-couple', src: mg('km-andando0'), alt: '' }) as HTMLImageElement;
    const gang = h('div', { class: 'km-gang' }, ...['nathan', 'vitoria', 'ruan', 'felipe', 'puggian'].map((id) => h('img', { src: face(id), alt: '' })));
    const world = h('div', { class: 'km-world' });
    const car = h('img', { class: 'km-car', src: mg('km-carro'), alt: '' });
    const fx = h('div', { class: 'fr-fx' });
    const rules = h(
      'div',
      { class: 'cs-rules km-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('km-poca'), alt: '' }), h('span', {}, 'Nenhum Uber aceitou! Andem até a Praia do Forte. Pule poça, cone, buraco e chinelo com ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), '.')),
      h('div', {}, h('img', { src: mg('km-cachorro'), alt: '' }), h('span', {}, 'Cachorro dormindo: segure ', h('kbd', {}, '↓'), ' pra passar na ponta do pé, senão ele acorda latindo!')),
      h('div', {}, h('img', { src: mg('km-carro'), alt: '' }), h('span', {}, 'Cada tropeço custa um minutinho. Chegue antes da meia-noite! No km 3... alguém vai aparecer.')),
    );
    ui.stage.append(sky, city, lamps, road, world, gang, walk, car, fx, rules);

    const KM_RIDE = 3;
    let dist = 0; // km
    let clock = 22 * 60 + 2; // minutos (22:02)
    let jump = 0;
    let tip = false;
    let stumbles = 0;
    let spawnIn = 1.4;
    let phase: 'rules' | 'walk' | 'ride' | 'done' = 'rules';
    let last = 0;
    let raf = 0;
    let frameT = 0;
    const obs: Obs[] = [];
    for (let i = 0; i < 6; i++) lamps.append(h('img', { src: mg('km-poste'), alt: '', style: `left:${i * 20}%` }));
    const sbK = h('b', { class: 'so-sb-n' }, '0,0');
    const sbC = h('b', { class: 'so-sb-time' }, '22:02');
    const sbS = h('b', { class: 'so-sb-n' }, '0');
    ui.hud.replaceChildren(h('div', { class: 'so-sb' }, h('div', { class: 'so-sb-chip time' }, h('span', {}, 'Relógio'), sbC), h('div', { class: 'so-sb-chip' }, h('span', {}, 'Km'), sbK, h('span', {}, '/5')), h('div', { class: 'so-sb-chip' }, h('span', {}, 'Tropeços'), sbS)));
    const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
    const hud = () => {
      sbK.textContent = dist.toFixed(1).replace('.', ',');
      sbC.textContent = fmt(clock);
      sbC.classList.toggle('hurry', clock > 23 * 60 + 40);
      sbS.textContent = String(stumbles);
    };
    const pop = (text: string, cls: string) => {
      const el = h('b', { class: `fr-pop ${cls}`, style: 'left:30%;top:42%' }, text);
      fx.append(el);
      setTimeout(() => el.remove(), 900);
    };
    const KINDS = ['poca', 'cone', 'buraco', 'chinelo', 'cachorro'];
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (phase === 'walk') {
        const speed = 0.11; // km/s de jogo
        dist += speed * dt;
        clock += dt * 2.6; // ~2 min de relógio por segundo
        if (jump > 0) jump -= dt;
        tip = !!keyDown;
        frameT += dt * (tip ? 4 : 8);
        walk.src = mg(`km-andando${Math.floor(frameT) % 4}`);
        walk.classList.toggle('jump', jump > 0);
        walk.classList.toggle('tip', tip && jump <= 0);
        const scroll = (t / 1000) * 260;
        city.style.backgroundPositionX = `${-scroll * 0.3}px`;
        road.style.backgroundPositionX = `${-scroll}px`;
        lamps.style.transform = `translateX(${-((scroll * 0.9) % (window.innerWidth * 0.2))}px)`;
        spawnIn -= dt;
        if (spawnIn <= 0 && dist < KM_RIDE - 0.15) {
          const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
          const el = h('img', { class: `km-obs ${kind}`, src: mg(`km-${kind}`), alt: '' });
          world.append(el);
          obs.push({ el, x: 108, kind, done: false });
          spawnIn = Math.max(0.75, 1.5 - dist * 0.18) + Math.random() * 0.6;
        }
        for (let i = obs.length - 1; i >= 0; i--) {
          const o = obs[i];
          o.x -= 46 * dt;
          o.el.style.left = `${o.x}%`;
          if (!o.done && o.x < 32 && o.x > 22) {
            o.done = true;
            const ok = o.kind === 'cachorro' ? tip && jump <= 0 : jump > 0;
            if (ok) {
              AudioSystem.play('pickup');
              pop(o.kind === 'cachorro' ? 'Shhh... passou!' : 'Pulou!', 'good');
            } else {
              stumbles++;
              clock += 4;
              ui.shake();
              AudioSystem.play('cancel');
              walk.classList.add('hit');
              setTimeout(() => walk.classList.remove('hit'), 500);
              const lines: Record<string, string> = { poca: 'Pisei na poça! Meu tênis branco!', cone: 'Quem bota um cone no meio da calçada?!', buraco: 'Buraco! Tô bem, tô bem.', chinelo: 'De quem é esse chinelo?!', cachorro: 'AU AU AU! Desculpa, cachorrinho!' };
              pop('-4 min', 'bad');
              ui.say(o.kind === 'cachorro' ? 'weng' : 'bella', lines[o.kind]);
            }
          }
          if (o.x < -12) {
            o.el.remove();
            obs.splice(i, 1);
          }
        }
        if (dist >= 1 && dist - speed * dt < 1) ui.say('nathan', 'Um quilômetro! Só faltam quatro! (só.)');
        if (dist >= 2 && dist - speed * dt < 2) ui.say('vitoria', 'Meu pé tá doendo, mas a gente vai chegar!');
        if (dist >= KM_RIDE) return ride();
        hud();
      }
      raf = requestAnimationFrame(tick);
    };
    const ride = async () => {
      phase = 'ride';
      hud();
      walk.src = mg('km-cansados');
      walk.classList.remove('jump', 'tip');
      ui.say('bella', 'Weng... eu não aguento mais dois quilômetros. Eu vou virar o ano na calçada.');
      await wait(1200);
      car.classList.add('in');
      AudioSystem.play('confirm');
      await wait(1300);
      ui.say('weng', 'Moço! Moço, tá indo pro Forte?! ...ELE PAROU! CARONA!');
      await wait(1600);
      ui.say('puggian', 'Cabe todo mundo! Encolhe! Encolhe!');
      car.classList.add('go');
      walk.classList.add('gone');
      gang.classList.add('gone');
      await wait(1400);
      dist = 5;
      clock = Math.min(clock + 6, 23 * 60 + 59);
      hud();
      finish();
    };
    const finish = () => {
      if (phase === 'done') return;
      phase = 'done';
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      const left = Math.max(0, 24 * 60 - clock);
      const stars = stumbles <= 1 ? 3 : stumbles <= 4 ? 2 : 1;
      ui.say('bella', `Chegamos às ${fmt(clock)}! Faltando ${Math.round(left)} minutos! A gente CONSEGUIU!`);
      ui.end(stars, 'Correr pra areia', () => resolve({ stars, mistakes: stumbles, left }));
    };
    let keyDown = false;
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame') return;
      const c = e.code;
      if (c === 'ArrowDown' || c === 'KeyS') {
        e.preventDefault();
        keyDown = true;
        return;
      }
      if (e.repeat || (c !== 'Space' && c !== 'KeyE' && c !== 'Enter')) return;
      e.preventDefault();
      if (phase === 'rules') return start();
      if (phase === 'walk' && jump <= 0) {
        jump = 0.6;
        AudioSystem.play('blip');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keyDown = false;
    };
    const start = () => {
      if (phase !== 'rules') return;
      rules.classList.add('off');
      phase = 'walk';
      ui.actions.replaceChildren();
      ui.say('weng', 'Cinco quilômetros. Duas horas. A gente consegue. Bora, turma!');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Bora andando!');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    hud();
    ui.say('ruan', 'Nenhum Uber aceita. NENHUM. É réveillon, todo mundo tá na rua.');
    raf = requestAnimationFrame(tick);
  });
}
