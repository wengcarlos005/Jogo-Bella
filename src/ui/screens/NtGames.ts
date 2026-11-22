import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';
import { shell, type MiniResult } from './PetroGames';
import { heldKeys } from './RoGames';
import { assetURL } from '@/utils/asset';

/** Minigames de Niterói (sprites em assets/minigames/ch-*, ft-*, bq-*). Tudo só com teclado. */
const mg = (f: string) => assetURL(`assets/minigames/${f}.png`);
const npcSheet = (f: string) => assetURL(`assets/npcs/${f}-walk.png`);

// ====================================================================== Chuva de chocolate
/**
 * A mãe da Lilian, lá em cima, joga chocolate. A Bella, com a sacola rosa, pega andando com ← →.
 * Cada doce vale ponto (caixa de coração vale muito); pegar seguido dá combo. Brócolis tira 1 ♥ (são 3).
 */
const DOCES = [
  { id: 'bombom', pts: 1, w: 1 },
  { id: 'barra-vermelha', pts: 1, w: 1 },
  { id: 'barra-azul', pts: 1, w: 1 },
  { id: 'brigadeiro', pts: 2, w: 0.8 },
  { id: 'ovinho', pts: 2, w: 0.8 },
  { id: 'ovo', pts: 3, w: 0.5 },
  { id: 'caixa', pts: 5, w: 0.25 },
];
export function playChocolateGame(parent: HTMLElement): Promise<MiniResult & { pts: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'ch', 'Chuva de chocolate');
    const bg = textureURL('map-nt-apto-bg');
    const TIME = 35;
    const aunt = h('div', { class: 'ch-aunt', style: `background-image:url(${npcSheet('mae-lilian')})` });
    const bella = h('img', { class: 'ch-bella', src: mg('ch-bella0'), alt: '' }) as HTMLImageElement;
    const field = h('div', { class: 'ch-field' });
    const fx = h('div', { class: 'fr-fx' });
    const rules = h(
      'div',
      { class: 'cs-rules ch-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('ch-bella1'), alt: '' }), h('span', {}, 'A mãe da Lilian tá jogando chocolate! Ande com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' e pegue com a sacola.')),
      h('div', {}, h('img', { src: mg('ch-caixa'), alt: '' }), h('span', {}, 'Brigadeiro e ovinho valem 2, o ovo grande 3 e a ', h('u', { class: 'g' }, 'caixa de coração'), ' vale 5! Pegando seguido, o combo multiplica.')),
      h('div', {}, h('img', { src: mg('ch-brocolis'), alt: '' }), h('span', {}, `Ela escondeu brócolis no meio! Pegou brócolis: perde 1 ♥ (são 3). ${TIME} segundos.`)),
    );
    ui.stage.append(h('div', { class: 'ch-bg', style: bg ? `background-image:url(${bg})` : '' }), aunt, field, bella, fx, rules);

    let x = 50;
    let ax = 50;
    let aDir = 1;
    let time = TIME;
    let pts = 0;
    let got = 0;
    let combo = 0;
    let lives = 3;
    let spawnIn = 0.6;
    let catchT = 0;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;
    const items: { el: HTMLElement; x: number; y: number; v: number; id: string; pts: number; rot: number }[] = [];
    const keys = heldKeys();

    const sbT = h('b', { class: 'so-sb-time' }, String(TIME));
    const sbP = h('b', { class: 'so-sb-n' }, '0');
    const sbC = h('b', { class: 'fr-mult' }, 'x1');
    const sbL = h('div', { class: 'tp-sb-lives' });
    ui.hud.replaceChildren(h('div', { class: 'so-sb' }, h('div', { class: 'so-sb-chip time' }, h('span', {}, 'Tempo'), sbT), h('div', { class: 'so-sb-chip' }, h('span', {}, 'Chocolates'), sbP, sbC), h('div', { class: 'so-sb-chip' }, sbL)));
    const mult = () => (combo >= 10 ? 3 : combo >= 5 ? 2 : 1);
    const hud = () => {
      const t = Math.max(0, Math.ceil(time));
      sbT.textContent = String(t);
      sbT.classList.toggle('hurry', running && t <= 8);
      if (sbP.textContent !== String(pts)) {
        sbP.textContent = String(pts);
        sbP.classList.remove('bump');
        void sbP.offsetWidth;
        sbP.classList.add('bump');
      }
      sbC.textContent = `x${mult()}`;
      sbC.className = `fr-mult m${mult()}`;
      sbL.replaceChildren(...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥')));
    };
    const pop = (px: number, py: number, text: string, cls: string) => {
      const el = h('b', { class: `fr-pop ${cls}`, style: `left:${px}%;top:${py}%` }, text);
      fx.append(el);
      setTimeout(() => el.remove(), 900);
    };
    const pick = () => {
      if (Math.random() < 0.12 + (TIME - time) * 0.004) return { id: 'brocolis', pts: -1 };
      const tot = DOCES.reduce((a, d) => a + d.w, 0);
      let r = Math.random() * tot;
      for (const d of DOCES) if ((r -= d.w) <= 0) return d;
      return DOCES[0];
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        time -= dt;
        const dx = (keys.k.r ? 1 : 0) - (keys.k.l ? 1 : 0);
        x = Math.max(8, Math.min(92, x + dx * 62 * dt));
        bella.style.left = `${x}%`;
        bella.style.transform = `translateX(-50%) rotate(${dx * 4}deg)`;
        if (catchT > 0) {
          catchT -= dt;
          if (catchT <= 0) bella.src = mg('ch-bella0');
        }
        // a tia anda de um lado pro outro lá em cima
        ax += aDir * (18 + (TIME - time) * 0.5) * dt;
        if (ax > 88 || ax < 12) aDir *= -1;
        if (Math.random() < dt * 0.6) aDir *= -1;
        aunt.style.left = `${ax}%`;
        aunt.style.backgroundPositionY = aDir > 0 ? '66.666%' : '33.333%';
        aunt.style.backgroundPositionX = `${(Math.floor(t / 150) % 4) * 33.333}%`;
        spawnIn -= dt;
        if (spawnIn <= 0) {
          const d = pick();
          const el = h('img', { class: 'ch-item' + (d.id === 'brocolis' ? ' bad' : d.id === 'caixa' ? ' gold' : ''), src: mg(`ch-${d.id}`), alt: '' });
          field.append(el);
          items.push({ el, x: ax, y: 16, v: 30 + Math.random() * 14 + (TIME - time) * 1.1, id: d.id, pts: d.pts, rot: Math.random() * 360 });
          spawnIn = Math.max(0.32, 0.75 - (TIME - time) * 0.012) + Math.random() * 0.25;
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.v * dt;
          it.rot += dt * 120;
          it.el.style.left = `${it.x}%`;
          it.el.style.top = `${it.y}%`;
          it.el.style.transform = `translate(-50%, -50%) rotate(${it.rot}deg)`;
          // a sacola fica na altura da cabeça da Bella (≈ 60% da tela)
          if (it.y > 56 && it.y < 70 && Math.abs(it.x - x) < 8) {
            it.el.remove();
            items.splice(i, 1);
            if (it.pts < 0) {
              combo = 0;
              lives--;
              ui.shake();
              AudioSystem.play('cancel');
              pop(x, 50, 'BRÓCOLIS?!', 'bad');
              ui.say('bella', ['Tia! Isso é brócolis!', 'Quem colocou brócolis no meio dos chocolates?!', 'O MINGAU colocou esse brócolis, eu sei.'][3 - lives - 1] ?? 'Brócolis de novo!');
              hud();
              if (lives <= 0) return finish();
            } else {
              combo++;
              const g = it.pts * mult();
              pts += g;
              got++;
              catchT = 0.25;
              bella.src = mg('ch-bella1');
              AudioSystem.play(it.pts >= 3 ? 'quest' : 'pickup');
              pop(x, 50, it.id === 'caixa' ? `CAIXA DE CORAÇÃO! +${g}` : `+${g}`, it.pts >= 3 ? 'perfect' : 'good');
              const sp = h('img', { class: 'ch-spark', src: mg('ch-brilho'), alt: '', style: `left:${x}%` });
              fx.append(sp);
              setTimeout(() => sp.remove(), 500);
              if (combo === 5) ui.say('mae-lilian', 'Isso! Pega, pega! Tem muito mais!');
              if (combo === 10) ui.say('weng', 'DEZ seguidos! A sacola vai rasgar!');
            }
            continue;
          }
          if (it.y > 104) {
            if (it.pts > 0) combo = 0;
            it.el.remove();
            items.splice(i, 1);
          }
        }
        if (time <= 0) return finish();
        hud();
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      keys.off();
      window.removeEventListener('keydown', onKey);
      hud();
      const stars = lives > 0 && pts >= 45 ? 3 : pts >= 22 ? 2 : 1;
      ui.say(stars >= 2 ? 'mae-lilian' : 'bella', stars >= 2 ? `${got} chocolates! Agora sim. Leva tudo pra casa, hein!` : 'Tia, eu não aguento mais segurar... nem comer brócolis.');
      ui.end(stars, 'Guardar os chocolates', () => resolve({ stars, mistakes: 3 - lives, pts }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if ((e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') && !running && !done) {
        e.preventDefault();
        start();
      }
    };
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren();
      ui.say('mae-lilian', 'Abre a sacola, Bella! Lá vai!');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Abrir a sacola');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    bella.style.left = `${x}%`;
    aunt.style.left = `${ax}%`;
    hud();
    ui.say('bella', 'Tia, não precisa, sério...');
    raf = requestAnimationFrame(tick);
  });
}

// ====================================================================== Foto no Niemeyer
/**
 * O tio tira a foto do casal. O visor balança (mão tremendo, vento): segure as setas pra
 * manter o casal dentro do quadradinho do meio e o Pão de Açúcar dentro do visor, e aperte
 * Espaço / E pra bater. 3 fotos, uma por pose. Cuidado com a gaivota "photobomb"!
 */
const POSES = [
  { img: 'ft-coracao', name: 'Coração com as mãos' },
  { img: 'ft-paz', name: 'Paz e amor' },
  { img: 'ft-abraco', name: 'Abraço' },
];
export function playFotoNiemeyerGame(parent: HTMLElement): Promise<MiniResult & { score: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'ft', 'Foto no Niemeyer');
    const bg = textureURL('map-nt-niemeyer-bg');
    const scene = h('div', { class: 'ft-scene' }, bg ? h('img', { class: 'ft-bg', src: bg, alt: '' }) : null);
    const couple = h('img', { class: 'ft-couple', src: mg(POSES[0].img), alt: '' }) as HTMLImageElement;
    const gull = h('img', { class: 'ft-gull', src: mg('ft-gaivota1'), alt: '' }) as HTMLImageElement;
    const finder = h('div', { class: 'ft-finder' }, h('i', { class: 'c tl' }), h('i', { class: 'c tr' }), h('i', { class: 'c bl' }), h('i', { class: 'c br' }), h('i', { class: 'ft-focus' }), h('b', { class: 'ft-rec' }, '● REC'));
    const flash = h('div', { class: 'ft-flash' });
    const strip = h('div', { class: 'ft-strip' });
    const poseTag = h('div', { class: 'ft-pose' });
    const fx = h('div', { class: 'fr-fx' });
    scene.append(couple, gull);
    const rules = h(
      'div',
      { class: 'cs-rules ft-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('ft-coracao'), alt: '' }), h('span', {}, 'O tio tá tirando a foto, mas a mão treme! Segure as ', h('kbd', {}, 'setas'), ' pra deixar o casal no ', h('u', { class: 'g' }, 'quadradinho do meio'), '.')),
      h('div', {}, h('span', { class: 'ft-ico' }, '⛰'), h('span', {}, 'Ponto extra se o Pão de Açúcar (lá no fundo, à direita) aparecer no visor. Aperte ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), ' pra bater.')),
      h('div', {}, h('img', { src: mg('ft-gaivota1'), alt: '' }), h('span', {}, 'Se a gaivota estiver no visor na hora da foto, é photobomb! São 3 fotos, uma pra cada pose.')),
    );
    ui.stage.append(scene, finder, poseTag, strip, fx, flash, rules);

    // tudo em % da cena; o visor tem 44% x 62%
    const FW = 44;
    const FH = 62;
    const COUPLE = { x: 56, y: 58 }; // centro do casal
    const LOAF = { x: 88, y: 10 }; // Pão de Açúcar
    let fx0 = 34;
    let fy0 = 27;
    let vx = 0;
    let vy = 0;
    let shot = 0;
    let score = 0;
    let gx = -20;
    let gy = 20;
    let gv = 0;
    let gullIn = 2.5;
    let wob = 0;
    let running = false;
    let done = false;
    let busy = false;
    let last = 0;
    let raf = 0;
    const keys = heldKeys();

    const sbS = h('b', { class: 'so-sb-n' }, '0');
    const sbF = h('b', { class: 'so-sb-n' }, '0/3');
    const sbQ = h('i', {});
    ui.hud.replaceChildren(h('div', { class: 'so-sb' }, h('div', { class: 'so-sb-chip' }, h('span', {}, 'Foto'), sbF), h('div', { class: 'so-sb-chip' }, h('span', {}, 'Pontos'), sbS), h('div', { class: 'so-sb-burn' }, h('span', { class: 'lbl' }, 'Enquadramento'), h('div', { class: 'so-sb-bar ft-q' }, sbQ))));
    const quality = () => {
      const cx = fx0 + FW / 2;
      const cy = fy0 + FH / 2;
      const d = Math.hypot((COUPLE.x - cx) / FW, (COUPLE.y - cy) / FH);
      const center = Math.max(0, 1 - d * 3.2);
      const loaf = LOAF.x > fx0 && LOAF.x < fx0 + FW && LOAF.y > fy0 && LOAF.y < fy0 + FH;
      const gullIn = gx > fx0 && gx < fx0 + FW && gy > fy0 && gy < fy0 + FH;
      return { center, loaf, gullIn };
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running && !busy) {
        wob += dt;
        const k = 1 + shot * 0.45;
        // mão tremendo + vento: um empurrão que muda devagar
        vx += (Math.sin(wob * 1.3) * 18 + Math.sin(wob * 3.7) * 9) * k * dt;
        vy += (Math.cos(wob * 1.1) * 13 + Math.sin(wob * 4.1) * 6) * k * dt;
        const ix = (keys.k.r ? 1 : 0) - (keys.k.l ? 1 : 0);
        const iy = (keys.k.d ? 1 : 0) - (keys.k.u ? 1 : 0);
        vx += ix * 110 * dt;
        vy += iy * 110 * dt;
        vx *= Math.pow(0.08, dt);
        vy *= Math.pow(0.08, dt);
        fx0 = Math.max(-6, Math.min(100 - FW + 6, fx0 + vx * dt));
        fy0 = Math.max(-6, Math.min(100 - FH + 6, fy0 + vy * dt));
        // gaivota cruzando
        gullIn -= dt;
        if (gullIn <= 0 && gv === 0) {
          gv = (Math.random() < 0.5 ? 1 : -1) * (22 + Math.random() * 10);
          gx = gv > 0 ? -10 : 110;
          gy = 14 + Math.random() * 40;
        }
        if (gv) {
          gx += gv * dt;
          gy += Math.sin(t / 300) * 0.15;
          gull.src = mg(Math.floor(t / 180) % 2 ? 'ft-gaivota1' : 'ft-gaivota2');
          gull.style.transform = `translate(-50%, -50%) scaleX(${gv > 0 ? 1 : -1})`;
          if (gx < -15 || gx > 115) {
            gv = 0;
            gullIn = 2 + Math.random() * 3;
          }
        }
        gull.style.left = `${gx}%`;
        gull.style.top = `${gy}%`;
        const q = quality();
        finder.classList.toggle('good', q.center > 0.75);
        finder.classList.toggle('loaf', q.loaf);
        sbQ.style.width = `${Math.round(q.center * 100)}%`;
        sbQ.className = q.center > 0.75 ? '' : q.center > 0.4 ? 'warm' : 'hot';
      }
      finder.style.left = `${fx0}%`;
      finder.style.top = `${fy0}%`;
      finder.style.width = `${FW}%`;
      finder.style.height = `${FH}%`;
      raf = requestAnimationFrame(tick);
    };
    const snap = async () => {
      if (!running || busy || done) return;
      busy = true;
      const q = quality();
      let pts = Math.round(q.center * 60) + (q.loaf ? 30 : 0) - (q.gullIn ? 25 : 0);
      pts = Math.max(0, pts);
      score += pts;
      AudioSystem.play('confirm');
      flash.classList.remove('on');
      void flash.offsetWidth;
      flash.classList.add('on');
      const grade = pts >= 75 ? 'PERFEITA!' : pts >= 45 ? 'Boa!' : 'Tremida...';
      const thumb = h('div', { class: 'ft-thumb' + (pts >= 75 ? ' best' : '') }, h('img', { src: mg(POSES[shot].img), alt: '' }), h('span', {}, `${grade} ${pts}`), q.gullIn ? h('img', { class: 'ft-thumb-gull', src: mg('ft-gaivota1'), alt: '' }) : null);
      strip.append(thumb);
      const el = h('b', { class: `fr-pop ${pts >= 75 ? 'perfect' : pts >= 45 ? 'good' : 'meh'}`, style: 'left:50%;top:40%' }, `${grade} +${pts}${q.loaf ? ' · Pão de Açúcar!' : ''}`);
      fx.append(el);
      setTimeout(() => el.remove(), 1100);
      if (q.gullIn) ui.say('bella', 'PHOTOBOMB DA GAIVOTA! Ela quis sair na foto também!');
      else if (pts >= 75) ui.say('tio-nt', 'Essa ficou de capa de revista!');
      else if (pts < 45) ui.say('tio-nt', 'Ih, tremeu. Culpa do vento, não do tio.');
      else ui.say('weng', 'Ficou boa! O Niemeyer aprovaria.');
      shot++;
      sbF.textContent = `${shot}/3`;
      sbS.textContent = String(score);
      await new Promise((r) => setTimeout(r, 1400));
      if (shot >= POSES.length) return finish();
      couple.src = mg(POSES[shot].img);
      poseTag.textContent = `Pose ${shot + 1}: ${POSES[shot].name}`;
      busy = false;
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      keys.off();
      window.removeEventListener('keydown', onKey);
      const stars = score >= 210 ? 3 : score >= 130 ? 2 : 1;
      ui.say(stars >= 2 ? 'bella' : 'tio-nt', stars === 3 ? `${score} pontos! Três fotos lindas. Essa do abraço vai pro porta-retrato.` : stars === 2 ? 'Ficaram boas! Uma ou outra tremidinha, mas é o charme.' : 'Tremeram todas... mas a gente tá sorrindo em todas. Vale!');
      ui.end(stars, 'Guardar as fotos', () => resolve({ stars, mistakes: 0, score }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      e.preventDefault();
      if (!running && !done) start();
      else void snap();
    };
    const snapBtn = h('button', { class: 'btn primary ce-serve' }, 'Bater a foto');
    snapBtn.addEventListener('click', () => void snap());
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren(snapBtn);
      poseTag.textContent = `Pose 1: ${POSES[0].name}`;
      ui.say('tio-nt', 'Deixa que eu tiro! Chega mais perto um do outro. Mais!');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Dar o celular pro tio');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    ui.say('bella', 'Tio, pega o Pão de Açúcar atrás, tá? Senão não vale.');
    raf = requestAnimationFrame(tick);
  });
}

// ====================================================================== Bandeja do churrasco
/**
 * No balcão do On Fire, o Weng ajuda o pitmaster a montar a bandeja de cada um da família.
 * O pedido aparece em cima (rosto + itens). Escolha a comida com as setas e coloque com
 * Espaço / E. Item errado: erro. Bandeja completa: entrega! 9 pedidos, contra o relógio.
 */
const COMIDAS: { id: string; name: string }[] = [
  { id: 'brisket', name: 'Brisket' },
  { id: 'costela', name: 'Costela' },
  { id: 'pulled', name: 'Pulled pork' },
  { id: 'linguica', name: 'Linguiça' },
  { id: 'mac', name: 'Mac & cheese' },
  { id: 'salada', name: 'Salada' },
  { id: 'milho', name: 'Milho' },
  { id: 'batata', name: 'Batata' },
  { id: 'molho', name: 'Molho barbecue' },
];
const PEDIDOS: { who: string; name: string; items: string[]; line: string }[] = [
  { who: 'tio-nt', name: 'Tio', items: ['brisket', 'costela', 'linguica'], line: 'Carne, carne e carne. É churrasco!' },
  { who: 'mae-lilian', name: 'Mãe da Lilian', items: ['salada', 'milho', 'mac'], line: 'Pra mim o leve. E sobremesa depois, hein!' },
  { who: 'lilian', name: 'Lilian', items: ['pulled', 'batata', 'molho'], line: 'Pulled pork com muito molho!' },
  { who: 'vinicius', name: 'Vinicius', items: ['costela', 'batata', 'milho'], line: 'Primeira vez aqui. O que tiver de melhor!' },
  { who: 'vivian', name: 'Vivian', items: ['mac', 'batata', 'milho'], line: 'Mac and cheese é inegociável.' },
  { who: 'diego', name: 'Diego', items: ['brisket', 'costela', 'pulled', 'linguica'], line: 'Doze horas de defumação. EU QUERO TUDO.' },
  { who: 'mingau', name: 'Mingau', items: ['batata', 'linguica', 'molho'], line: 'Batata! E linguiça! E nada verde!' },
  { who: 'bella', name: 'Bella', items: ['brisket', 'mac', 'batata'], line: 'O brisket com aquele anel rosa. E mac and cheese.' },
  { who: 'weng', name: 'Weng', items: ['costela', 'pulled', 'linguica', 'molho'], line: 'A minha eu monto caprichada.' },
];
export function playBandejaGame(parent: HTMLElement): Promise<MiniResult & { served: number }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'bq', 'Bandeja do churrasco');
    const bg = textureURL('map-nt-onfire-bg');
    const TIME = 80;
    const order = h('div', { class: 'bq-order' });
    const grid = h('div', { class: 'bq-grid' }, ...COMIDAS.map((c) => h('div', { class: 'bq-cell', 'data-id': c.id }, h('img', { src: mg(`bq-${c.id}`), alt: '' }), h('span', {}, c.name))));
    const trayItems = h('div', { class: 'bq-tray-items' });
    const tray = h('div', { class: 'bq-tray' }, h('img', { src: mg('bq-bandeja'), alt: '' }), trayItems);
    const fx = h('div', { class: 'fr-fx' });
    const rules = h(
      'div',
      { class: 'cs-rules bq-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('bq-brisket'), alt: '' }), h('span', {}, 'O pedido de cada um aparece em cima. Escolha a comida com as ', h('kbd', {}, 'setas'), ' e coloque na bandeja com ', h('kbd', {}, 'Espaço'), ' / ', h('kbd', {}, 'E'), '.')),
      h('div', {}, h('img', { src: mg('bq-bandeja'), alt: '' }), h('span', {}, 'Bandeja completa vai direto pra mesa. Colocou o que a pessoa ', h('u', {}, 'não pediu'), ': erro!')),
      h('div', {}, h('img', { src: mg('bq-molho'), alt: '' }), h('span', {}, `São ${PEDIDOS.length} pedidos da família em ${TIME} segundos. Rápido, que a costela esfria!`)),
    );
    ui.stage.append(h('div', { class: 'bq-bg', style: bg ? `background-image:url(${bg})` : '' }), order, grid, tray, fx, rules);

    const COLS = 5;
    let sel = 0;
    let idx = 0;
    let have: string[] = [];
    let served = 0;
    let errors = 0;
    let time = TIME;
    let running = false;
    let done = false;
    let last = 0;
    let raf = 0;

    const sbT = h('b', { class: 'so-sb-time' }, String(TIME));
    const sbP = h('b', { class: 'so-sb-n' }, `0/${PEDIDOS.length}`);
    const sbE = h('b', { class: 'so-sb-n' }, '0');
    ui.hud.replaceChildren(h('div', { class: 'so-sb' }, h('div', { class: 'so-sb-chip time' }, h('span', {}, 'Tempo'), sbT), h('div', { class: 'so-sb-chip' }, h('span', {}, 'Entregues'), sbP), h('div', { class: 'so-sb-chip' }, h('span', {}, 'Erros'), sbE)));
    const paintSel = () => grid.querySelectorAll('.bq-cell').forEach((c, i) => c.classList.toggle('sel', i === sel));
    const paintOrder = () => {
      const p = PEDIDOS[idx];
      if (!p) return;
      const face = textureURL(`portrait-${p.who}`);
      order.replaceChildren(
        face ? h('img', { class: 'bq-face', src: face, alt: '' }) : h('span', {}),
        h('div', { class: 'bq-order-txt' }, h('b', {}, `${p.name} pediu:`), h('span', {}, `"${p.line}"`)),
        h('div', { class: 'bq-want' }, ...p.items.map((it) => h('div', { class: 'bq-want-i' + (have.includes(it) ? ' ok' : '') }, h('img', { src: mg(`bq-${it}`), alt: '' })))),
      );
      order.classList.remove('in');
      void order.offsetWidth;
      order.classList.add('in');
    };
    const pop = (text: string, cls: string) => {
      const el = h('b', { class: `fr-pop ${cls}`, style: 'left:50%;top:62%' }, text);
      fx.append(el);
      setTimeout(() => el.remove(), 900);
    };
    const put = () => {
      if (!running || done) return;
      const p = PEDIDOS[idx];
      const id = COMIDAS[sel].id;
      const cell = grid.querySelectorAll('.bq-cell')[sel] as HTMLElement;
      if (!p.items.includes(id) || have.includes(id)) {
        errors++;
        sbE.textContent = String(errors);
        AudioSystem.play('cancel');
        ui.shake();
        cell.classList.remove('no');
        void cell.offsetWidth;
        cell.classList.add('no');
        pop(have.includes(id) ? 'Já tem!' : `${p.name} não pediu isso!`, 'bad');
        return;
      }
      have.push(id);
      AudioSystem.play('pickup');
      const k = have.length - 1;
      const im = h('img', { src: mg(`bq-${id}`), alt: '', style: `left:${4 + (k % 2) * 48}%;top:${-8 + Math.floor(k / 2) * 48}%` });
      trayItems.append(im);
      paintOrder();
      if (have.length === p.items.length) {
        served++;
        sbP.textContent = `${served}/${PEDIDOS.length}`;
        AudioSystem.play('quest');
        pop(`Entregue: ${p.name}!`, 'perfect');
        tray.classList.add('go');
        running = false;
        setTimeout(() => {
          tray.classList.remove('go');
          trayItems.replaceChildren();
          have = [];
          idx++;
          if (idx >= PEDIDOS.length) return finish();
          running = true;
          paintOrder();
          const n = PEDIDOS[idx];
          if (n.who === 'diego') ui.say('diego', 'A minha tem QUATRO coisas. Capricha!');
          else if (n.who === 'mingau') ui.say('mingau', 'Se colocar salada eu devolvo!');
          else if (n.who === 'bella') ui.say('weng', 'Agora a sua. Essa eu faço com carinho.');
        }, 650);
      }
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (running) {
        time -= dt;
        const s = Math.max(0, Math.ceil(time));
        sbT.textContent = String(s);
        sbT.classList.toggle('hurry', s <= 10);
        if (time <= 0) return finish();
      }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => {
      if (done) return;
      done = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      const stars = served === PEDIDOS.length && errors <= 2 ? 3 : served >= 6 ? 2 : 1;
      ui.say(stars >= 2 ? 'tio-nt' : 'weng', stars === 3 ? 'Todo mundo servido e ninguém reclamou! Contrata esse menino, moço!' : stars === 2 ? 'Quase todo mundo servido. O resto pega da bandeja do Diego.' : 'Deu um pouco de confusão... mas ninguém saiu com fome.');
      ui.end(stars, 'Comer!', () => resolve({ stars, mistakes: errors, served }));
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame') return;
      const c = e.code;
      if (!running && !done && !e.repeat && (c === 'Space' || c === 'KeyE' || c === 'Enter') && idx === 0 && served === 0 && !rules.classList.contains('off')) {
        e.preventDefault();
        return start();
      }
      if (!running) return;
      const row = Math.floor(sel / COLS);
      const col = sel % COLS;
      if (c === 'ArrowLeft' || c === 'KeyA') sel = row * COLS + Math.max(0, col - 1);
      else if (c === 'ArrowRight' || c === 'KeyD') sel = Math.min(COMIDAS.length - 1, row * COLS + Math.min(COLS - 1, col + 1));
      else if (c === 'ArrowUp' || c === 'KeyW') sel = Math.max(0, sel - COLS);
      else if (c === 'ArrowDown' || c === 'KeyS') sel = Math.min(COMIDAS.length - 1, sel + COLS);
      else if ((c === 'Space' || c === 'KeyE' || c === 'Enter') && !e.repeat) {
        e.preventDefault();
        return put();
      } else return;
      e.preventDefault();
      AudioSystem.play('blip');
      paintSel();
    };
    grid.querySelectorAll('.bq-cell').forEach((c, i) =>
      c.addEventListener('pointerdown', () => {
        sel = i;
        paintSel();
        put();
      }),
    );
    const start = () => {
      if (running || done) return;
      rules.classList.add('off');
      running = true;
      ui.actions.replaceChildren();
      paintOrder();
      ui.say('weng', 'Deixa comigo, moço. Eu monto as bandejas. Primeiro o tio!');
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Montar as bandejas');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    paintSel();
    ui.say('diego', 'Doze horas de defumação, Bella. DOZE. Eu não durmo hoje.');
    raf = requestAnimationFrame(tick);
  });
}
