import Phaser from 'phaser';
import type { Vec2 } from '@/core/types';

export interface Interactable {
  id: string;
  rect: () => Phaser.Geom.Rectangle;
  label: () => string;
  enabled: () => boolean;
  run: () => Promise<void> | void;
  /** Ponto (mundo) onde o prompt aparece. */
  anchor: () => Vec2;
}

/**
 * Sistema universal de interação: qualquer coisa registrada aqui
 * (NPC, porta, objeto, item) responde ao botão de ação quando o
 * jogador está de frente e perto.
 */
export class InteractionSystem {
  private items: Interactable[] = [];

  constructor(_scene: Phaser.Scene) {}

  add(i: Interactable): void {
    this.items = this.items.filter((x) => x.id !== i.id);
    this.items.push(i);
  }

  remove(id: string): void {
    this.items = this.items.filter((x) => x.id !== id);
  }

  /** Alvo sob o ponto à frente do jogador; desempate pela distância aos pés. */
  find(probe: Vec2, feet: Vec2): Interactable | null {
    let best: Interactable | null = null;
    let bestD = Infinity;
    for (const it of this.items) {
      if (!it.enabled()) continue;
      const r = Phaser.Geom.Rectangle.Clone(it.rect());
      Phaser.Geom.Rectangle.Inflate(r, 3, 3);
      if (!r.contains(probe.x, probe.y)) continue;
      const d = Phaser.Math.Distance.Between(feet.x, feet.y, r.centerX, r.centerY);
      if (d < bestD) {
        best = it;
        bestD = d;
      }
    }
    return best;
  }
}
