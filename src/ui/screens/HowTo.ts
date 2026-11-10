import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';

/**
 * Cartão "Como jogar" mostrado antes dos minigames que não têm as regras na própria tela.
 * Cada linha: um texto (com <kbd>[tecla]</kbd>, <u>{aviso}</u>) e, opcional, uma imagem de assets/minigames.
 * Fecha com Espaço / E / Enter ou o botão. Nada do minigame roda enquanto ele está aberto.
 */
export interface HowTo {
  title: string;
  rows: { img?: string; text: string }[];
}

const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;

/** "[Espaço]" vira tecla, "{perde 1 ♥}" vira aviso em vermelho. */
function rich(text: string): (HTMLElement | string)[] {
  const out: (HTMLElement | string)[] = [];
  const re = /\[([^\]]+)\]|\{([^}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] ? h('kbd', {}, m[1]) : h('u', {}, m[2]));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function showHowTo(parent: HTMLElement, howto: HowTo): Promise<void> {
  return new Promise((resolve) => {
    const btn = h('button', { class: 'btn primary' }, 'Entendi, bora!');
    const box = h(
      'div',
      { class: 'cs-rules ht-rules' },
      h('b', {}, 'Como jogar'),
      h('div', { class: 'ht-game' }, howto.title),
      ...howto.rows.map((r) => h('div', {}, r.img ? h('img', { src: mg(r.img), alt: '' }) : h('span', { class: 'ht-dot' }), h('span', {}, ...rich(r.text)))),
      h('div', { class: 'ht-actions' }, btn),
    );
    const screen = h('div', { class: 'screen ht-screen' }, box);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', onKey, true);
      AudioSystem.play('confirm');
      InputSystem.pop('minigame');
      screen.remove();
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) close();
    };
    // espera um instante: a tecla que abriu o minigame não fecha o cartão sem querer
    setTimeout(() => window.addEventListener('keydown', onKey, true), 250);
    btn.addEventListener('click', close);
  });
}

/** Regras dos minigames que não têm o "Como jogar" embutido. */
export const HOWTO: Record<string, HowTo> = {
  uber: {
    title: 'Corrida de Uber',
    rows: [
      { img: 'uber-redcar', text: 'O carro anda sozinho. Troque de faixa com [↑] [↓] (ou W / S, ou tocando em cima e embaixo).' },
      { img: 'uber-cone', text: 'Desvie das poças, cones, buracos e dos outros carros.' },
      { img: 'uber-poca', text: 'Cada batida {freia o carro} e a viagem demora mais. Menos batidas, mais estrelas.' },
    ],
  },
  burgerLivre: {
    title: 'Monte o seu hambúrguer',
    rows: [
      { text: 'Clique nos ingredientes (ou use as teclas [1] a [0]). Comece pelo pão de baixo.' },
      { text: 'Coloque de 2 a 6 recheios do seu jeito. [Backspace] desfaz o último.' },
      { text: 'Termine com o pão de cima e aperte [E] ou [Enter] pra servir. Aqui não tem erro!' },
    ],
  },
  burgerMemoria: {
    title: 'O pedido do Weng',
    rows: [
      { text: 'O pedido aparece por alguns segundos. {Decore a ordem} dos ingredientes!' },
      { text: 'Depois ele some: monte igualzinho, de baixo pra cima, clicando ou com as teclas [1] a [0].' },
      { text: 'Ingrediente errado conta como erro. "Lembrar pedido" mostra de novo, mas {custa uma estrela}.' },
    ],
  },
  grill: {
    title: 'Churrasqueira',
    rows: [
      { img: 'churr-picanha-0', text: 'Uma carne de cada vez vai pra grelha. O marcador corre pela barra de ponto.' },
      { img: 'churr-picanha-2', text: 'Aperte [Virar!] (ou [Espaço] / [E]) quando o marcador estiver no {verde}.' },
      { img: 'churr-fogo2', text: 'As fases ficam mais rápidas, o verde fica menor e às vezes muda de lugar. São 10 fases.' },
    ],
  },
  kiss: {
    title: 'Beijo escondido',
    rows: [
      { img: 'casal-beijo', text: '{Segure} [Espaço] / [E] (ou o botão) pra beijar. Cada beijo precisa de um tempinho sem soltar.' },
      { img: 'mae-espia', text: 'Ouviu passos? {Solte} e finja que tá vendo o filme! Se a mãe pegar no flagra, perde 1 ♥.' },
      { img: 'casal-inocente', text: 'Às vezes é só a Lala passando... e às vezes a mãe aparece sem aviso. São 7 beijos.' },
    ],
  },
  tacos: {
    title: 'Taco Roleta',
    rows: [
      { img: 'taco-pimenta', text: 'Olha onde o Weng esconde a pimenta. Depois o garçom embaralha os pratos.' },
      { img: 'taco-fechado', text: 'Siga com o olho e escolha um taco SEM pimenta: clique, ou [←] [→] e [Espaço] / [E].' },
      { img: 'taco-fogo', text: 'Comeu pimenta: {perde 1 ♥} (são 3). Nas 2 últimas rodadas são duas pimentas!' },
    ],
  },
  cards: {
    title: 'Bate-Gato',
    rows: [
      { img: 'carta-meli', text: 'Cada um vira uma carta falando em sequência: Meli, Pombo, Lala, Açaí, Coração.' },
      { img: 'carta-coracao', text: 'Se a carta for IGUAL à palavra falada, bata no monte com [Espaço] / [E] antes do Weng!' },
      { img: 'carta-novelo', text: 'O novelo embolado vale sempre. Bater sem motivo {perde 1 ponto}.' },
    ],
  },
  cook: {
    title: 'Jantar a dois',
    rows: [
      { img: 'cz-macarrao', text: 'Escolha a receita e pegue na bancada SÓ os ingredientes dela. Errado conta erro.' },
      { img: 'cz-faca', text: 'Cortar: a faca passa pela tábua. Aperte [Cortar!] (ou [Espaço]) em cima de cada marquinha.' },
      { img: 'cz-panela', text: 'Fogão: quando aparecer "Mexe!", mexa com [Espaço] / [E]. Quando o ponto estiver no verde, {desligue o fogo} com [Enter].' },
    ],
  },
  acai: {
    title: 'Monte o açaí',
    rows: [
      { img: 'acai-acai', text: 'Primeiro o açaí: 1 ou 2 bolas. Clique (ou use as teclas [1] a [0]).' },
      { img: 'acai-granola', text: 'Depois os complementos. A Bella ama açaí CHEIO: 7 ou mais complementos = 3 estrelas.' },
      { img: 'acai-colher', text: '[Backspace] desfaz. Pra servir, aperte a colher (ou [Enter]).' },
    ],
  },
  market: {
    title: 'A lista da Vó',
    rows: [
      { img: 'cz-ovo', text: 'As prateleiras vão passando. A lista da Vó fica do lado direito.' },
      { img: 'cz-queijo', text: 'Escolha a prateleira com [↑] [↓] e aperte [Espaço] / [E] quando um item da lista passar na frente da {mão}.' },
      { img: 'acai-pacoca', text: 'Item fora da lista conta como erro. A paçoca... a Bella pode tentar esconder no carrinho. São 45 segundos.' },
    ],
  },
  breakfast: {
    title: 'Café da manhã de aniversário',
    rows: [
      { img: 'cf-paodequeijo', text: 'O bilhete mostra o que a Bella ama. {Decore}: ele some em alguns segundos!' },
      { img: 'cf-bandeja', text: 'Depois escolha com as setas e aperte [Espaço] / [E] nas coisas certas pra montar a bandeja.' },
      { img: 'cf-mamao', text: 'Coisa que ela não ama conta como erro (mamão, nem pensar). Flor e cartãozinho são um extra.' },
    ],
  },
};
