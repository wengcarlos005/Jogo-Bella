import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { shell, type MiniResult } from './PetroGames';

/**
 * Minigame — Mesa Giratória (ceia de ano-novo na cobertura dos tios do Weng, Araruama).
 *
 * A mesa redonda tem um tampo de vidro que gira com os pratos da tia Tim. Alguém pede um prato;
 * gire o tampo (← → ou os botões, segurando) até o prato parar NA FRENTE de quem pediu e aperte
 * Espaço / E / SERVIR. Prato errado ou na frente da pessoa errada = perde 1 ♥ (são 3).
 * Do 4º pedido em diante, um dos pequenos gira a mesa "sem querer" no meio do caminho.
 * Pensado pra controle: direcional + 1 botão.
 */
type Dish = { id: string; name: string };
const DISHES: Dish[] = [
  { id: 'pato', name: 'pato' },
  { id: 'gergelim', name: 'bolinho de gergelim' },
  { id: 'macarrao', name: 'macarrão de arroz' },
  { id: 'arrozbranco', name: 'arroz branco' },
  { id: 'frango', name: 'frango xadrez' },
  { id: 'rolinho', name: 'rolinho primavera' },
  { id: 'bolinho', name: 'guioza' },
  { id: 'arroz', name: 'arroz frito' },
];
/** Lugares em volta da mesa (ângulo em graus: 0 = em cima, sentido horário). */
const SEATS = [
  { id: 'tim', name: 'Tia Tim', a: 0 },
  { id: 'anne', name: 'Anne', a: 45 },
  { id: 'mingau', name: 'Mingau', a: 90 },
  { id: 'julinha', name: 'Julinha', a: 135 },
  { id: 'bella', name: 'Bella', a: 180 },
  { id: 'weng', name: 'Weng', a: 225 },
  { id: 'layla', name: 'Laylinha', a: 270 },
  { id: 'tio', name: 'Tio', a: 315 },
];
const ROUNDS: { who: string; seat: string; dish: string; line: string; push?: string }[] = [
  { who: 'tia-tim', seat: 'bella', dish: 'pato', line: 'Bella, prova o pato! Gira a mesa e pega, pega!' },
  { who: 'weng', seat: 'layla', dish: 'gergelim', line: 'A Laylinha tá de olho no bolinho de gergelim. Manda pra ela.' },
  { who: 'weng', seat: 'weng', dish: 'macarrao', line: 'Amor, me passa o macarrão de arroz?' },
  { who: 'weng', seat: 'mingau', dish: 'frango', line: 'O Mingau quer o frango xadrez. Ele come como se fosse adulto.', push: 'A Julinha girou a mesa sem querer!' },
  { who: 'anne', seat: 'anne', dish: 'rolinho', line: 'Bella, me passa o rolinho? Por favor!', push: 'O Mingau deu um empurrão no vidro!' },
  { who: 'tia-tim', seat: 'tim', dish: 'pato', line: 'Agora devolve o pato pra mim que eu vou servir o resto!', push: 'A Laylinha girou com tudo!' },
];
const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;
const norm = (a: number) => ((a % 360) + 540) % 360 - 180; // -180..180

export function playCeiaGame(parent: HTMLElement): Promise<MiniResult> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'ce', 'Mesa Giratória');
    const TOL = 16; // graus de tolerância pra "na frente"
    let rot = 0;
    let vel = 0;
    let hold = 0; // -1, 0, 1
    let round = 0;
    let lives = 3;
    let mistakes = 0;
    let time = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    let pushAt = -1;

    const disc = h('div', { class: 'ce-disc' });
    const dishEls = DISHES.map((d) => {
      const el = h('img', { class: 'ce-dish', src: mg(`mg-${d.id}`), alt: d.name, title: d.name });
      disc.append(el);
      return el;
    });
    const seatEls = SEATS.map((s) => {
      const r = 51;
      const x = 50 + r * Math.sin((s.a * Math.PI) / 180);
      const y = 50 - r * Math.cos((s.a * Math.PI) / 180);
      return h('div', { class: `ce-seat${s.id === 'bella' ? ' me' : ''}`, style: `left:${x}%;top:${y}%` }, s.name);
    });
    const ask = h('div', { class: 'ce-ask off' }, h('img', { class: 'ce-ask-bg', src: mg('mg-balao'), alt: '' }), h('img', { class: 'ce-ask-dish', alt: '' }));
    const table = h('div', { class: 'ce-table' }, h('img', { class: 'ce-top', src: mg('mg-mesa'), alt: '' }), disc, ...seatEls, ask);
    const timer = h('i');
    const legend = h(
      'div',
      { class: 'ce-legend' },
      h('b', {}, 'Na mesa'),
      ...DISHES.map((d) => h('div', { class: 'ce-leg', 'data-dish': d.id }, h('img', { src: mg(`mg-${d.id}`), alt: '' }), h('span', {}, d.name))),
    );
    const orderWho = h('div', { class: 'ce-order-who' });
    const orderImg = h('img', { class: 'ce-order-img', alt: '' }) as HTMLImageElement;
    const orderDish = h('div', { class: 'ce-order-dish' });
    const order = h('div', { class: 'ce-order off' }, h('b', {}, 'Pedido'), orderWho, orderImg, orderDish, h('div', { class: 'ce-timer' }, timer));
    const rules = h(
      'div',
      { class: 'cs-rules ce-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('mg-pato'), alt: '' }), h('span', {}, 'Alguém pede um prato (o pedido aparece à direita). Gire o tampo de vidro com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' (segurando) até o prato ficar NA FRENTE de quem pediu.')),
      h('div', {}, h('img', { src: mg('mg-macarrao'), alt: '' }), h('span', {}, 'À esquerda tem o nome de cada prato da tia Tim: pato, macarrão de arroz, frango xadrez, guioza...')),
      h('div', {}, h('img', { src: mg('mg-balao'), alt: '' }), h('span', {}, 'Aí aperte ', h('kbd', {}, 'Espaço'), ' ou ', h('kbd', {}, 'E'), ' pra servir. O balão mostra quem pediu e o quê.')),
      h('div', {}, h('img', { src: mg('mg-hashi'), alt: '' }), h('span', {}, 'Prato errado, pessoa errada ou demorar demais: ', h('u', {}, 'perde 1 ♥'), ' (são 3). Cuidado com as crianças girando a mesa!')),
    );
    ui.stage.append(legend, table, order, rules);

    const left = h('button', { class: 'btn pd-steer', 'aria-label': 'Girar pra esquerda' }, '⟲');
    const serveBtn = h('button', { class: 'btn primary ce-serve' }, 'SERVIR');
    const right = h('button', { class: 'btn pd-steer', 'aria-label': 'Girar pra direita' }, '⟳');
    const startBtn = h('button', { class: 'btn primary' }, 'Começar a ceia');
    ui.actions.append(startBtn);

    const hud = () =>
      ui.hud.replaceChildren(
        h('span', {}, `Pedido ${Math.min(round + 1, ROUNDS.length)}/${ROUNDS.length}`),
        h('span', { class: 'nv-lives' }, ...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥'))),
      );
    const paint = () => {
      disc.style.transform = `rotate(${rot}deg)`;
      dishEls.forEach((el, i) => {
        // cada prato fica num raio do tampo, sempre "em pé" (contra-gira)
        const a = i * 45;
        el.style.transform = `translate(-50%, -50%) rotate(${a}deg) translateY(-205%) rotate(${-a - rot}deg)`;
      });
    };
    const seatOf = (id: string) => SEATS.find((s) => s.id === id)!;
    const showAsk = () => {
      const r = ROUNDS[round];
      const s = seatOf(r.seat);
      const rr = 40;
      ask.style.left = `${50 + rr * Math.sin((s.a * Math.PI) / 180)}%`;
      ask.style.top = `${50 - rr * Math.cos((s.a * Math.PI) / 180)}%`;
      (ask.querySelector('.ce-ask-dish') as HTMLImageElement).src = mg(`mg-${r.dish}`);
      ask.classList.remove('off', 'pop');
      void ask.offsetWidth;
      ask.classList.add('pop');
      seatEls.forEach((el, i) => el.classList.toggle('want', SEATS[i].id === r.seat));
      const dish = DISHES.find((d) => d.id === r.dish)!;
      orderWho.textContent = `${s.name} quer:`;
      orderImg.src = mg(`mg-${r.dish}`);
      orderDish.textContent = dish.name;
      order.classList.remove('off', 'pop');
      void order.offsetWidth;
      order.classList.add('pop');
      legend.querySelectorAll('.ce-leg').forEach((el) => el.classList.toggle('on', (el as HTMLElement).dataset.dish === r.dish));
    };
    const next = () => {
      if (round >= ROUNDS.length) return finish();
      const r = ROUNDS[round];
      time = Math.max(7, 12 - round);
      pushAt = r.push ? time * (0.45 + Math.random() * 0.2) : -1;
      hud();
      showAsk();
      ui.say(r.who, r.line);
      running = true;
    };
    const loseLife = (line: string) => {
      lives--;
      mistakes++;
      AudioSystem.play('cancel');
      ui.shake();
      ui.say('weng', line);
      hud();
      if (lives <= 0) {
        running = false;
        setTimeout(() => finish(), 900);
        return true;
      }
      return false;
    };
    const dishAngle = (id: string) => DISHES.findIndex((d) => d.id === id) * 45 + rot;
    const serve = () => {
      if (!running) return;
      const r = ROUNDS[round];
      const want = seatOf(r.seat).a;
      // qual prato está na frente de quem pediu?
      const front = DISHES.find((d) => Math.abs(norm(dishAngle(d.id) - want)) < TOL);
      if (front?.id === r.dish) {
        running = false;
        vel = 0;
        AudioSystem.play('pickup');
        const el = dishEls[DISHES.findIndex((d) => d.id === r.dish)];
        el.classList.remove('served');
        void el.offsetWidth;
        el.classList.add('served');
        const s = seatEls[SEATS.findIndex((x) => x.id === r.seat)];
        s.classList.add('happy');
        setTimeout(() => s.classList.remove('happy'), 900);
        ui.say(r.seat === 'bella' ? 'bella' : 'weng', pick(r.seat));
        round++;
        ask.classList.add('off');
        setTimeout(next, 1300);
        return;
      }
      const nome = front ? DISHES.find((d) => d.id === front.id)!.name : 'nada';
      loseLife(front ? `Isso é ${nome}! Gira mais um pouquinho.` : 'Não tem prato nenhum na frente dela ainda. Gira até parar certinho.');
    };
    const pick = (seat: string) =>
      ({
        bella: 'Hmmm... tia, esse pato tá MUITO bom!',
        layla: 'A Laylinha pegou dois bolinhos de uma vez. Ninguém viu.',
        weng: 'Valeu, amor. Você já tá girando essa mesa melhor que eu.',
        mingau: 'O Mingau comeu o frango em três garfadas.',
        anne: '"Obrigada, cunhada!" A Anne piscou pra você.',
        tim: 'A tia Tim sorriu: "Essa menina sabe girar mesa. Pode voltar sempre."',
      })[seat] ?? 'Servido!';
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      // giro com "peso": segurar acelera, soltar o vidro vai parando aos poucos
      if (hold) vel += hold * 520 * dt;
      vel *= Math.pow(hold ? 0.35 : 0.08, dt);
      vel = Math.max(-150, Math.min(150, vel));
      rot += vel * dt;
      paint();
      if (running) {
        time -= dt;
        timer.style.width = `${Math.max(0, (time / Math.max(7, 12 - round)) * 100)}%`;
        if (pushAt > 0 && time < pushAt) {
          pushAt = -1;
          vel += (Math.random() < 0.5 ? -1 : 1) * 260;
          ui.say('weng', ROUNDS[round].push!);
        }
        if (time <= 0) {
          running = false;
          if (!loseLife('Demorou! A tia Tim já levantou pra pegar o prato ela mesma.')) {
            round++;
            ask.classList.add('off');
            setTimeout(next, 1100);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      ask.classList.add('off');
      const won = lives > 0;
      const stars = !won ? 1 : lives === 3 ? 3 : lives === 2 ? 2 : 1;
      ui.say('tia-tim', won ? 'Comeu bem! Agora sim. Pode pegar mais, tem muito!' : 'Calma, menina, a mesa não foge! Deixa que a tia serve você.');
      ui.end(stars, 'Terminar a ceia', () => resolve({ stars, mistakes }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || done) return;
      const l = e.code === 'ArrowLeft' || e.code === 'KeyA';
      const r = e.code === 'ArrowRight' || e.code === 'KeyD';
      const act = e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter';
      if (!l && !r && !act) return;
      e.preventDefault();
      if (l) hold = -1;
      else if (r) hold = 1;
      else if (!e.repeat) {
        if (rules.classList.contains('off')) serve();
        else start();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && hold < 0) hold = 0;
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && hold > 0) hold = 0;
    };
    const holdBtn = (b: HTMLElement, d: number) => {
      b.addEventListener('pointerdown', () => (hold = d));
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => hold === d && (hold = 0));
    };
    holdBtn(left, -1);
    holdBtn(right, 1);
    serveBtn.addEventListener('click', serve);
    const start = () => {
      if (!rules.classList.contains('off') && !done) {
        rules.classList.add('off');
        ui.actions.replaceChildren(left, serveBtn, right);
        next();
      }
    };
    startBtn.addEventListener('click', start);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    hud();
    paint();
    ui.say('weng', 'A ceia da tia Tim. A mesa gira, então ninguém precisa levantar. Ajuda a servir?');
    raf = requestAnimationFrame(tick);
  });
}
