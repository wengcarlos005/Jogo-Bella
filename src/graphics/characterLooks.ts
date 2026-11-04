/**
 * Aparência dos personagens PROVISÓRIOS (placeholders procedurais).
 * Baseada na descrição oficial — serve só até a spritesheet do ChatGPT chegar.
 */
export interface CharacterLook {
  skin: string;
  hair: 'curly' | 'short' | 'bun';
  hairColor: string;
  hairShade: string;
  shirt: string;
  jacket?: string;
  pants: string;
  wideLegs?: boolean;
  shoes: string;
  glasses?: string;
  blush?: string;
  beard?: string;
  necklace?: string;
  dress?: boolean;
  portraitBg: string;
}

export const CHARACTER_LOOKS: Record<string, CharacterLook> = {
  bella: {
    skin: '#f1c7a5',
    hair: 'curly',
    hairColor: '#2d1d1a',
    hairShade: '#4a2f28',
    shirt: '#26222b',
    pants: '#c8b79a',
    wideLegs: true,
    shoes: '#f4f0e6',
    glasses: '#f27a9b',
    blush: '#f29a9a',
    necklace: '#ffd75e',
    portraitBg: '#f6d9e0',
  },
  weng: {
    skin: '#e6b88f',
    hair: 'short',
    hairColor: '#17141c',
    hairShade: '#2a2530',
    shirt: '#dfe3c4',
    jacket: '#2c2b36',
    pants: '#5d6b3c',
    shoes: '#e9e3d6',
    portraitBg: '#d9e6d2',
  },
  'mae-bella': {
    skin: '#e9b896',
    hair: 'bun',
    hairColor: '#3a2620',
    hairShade: '#563a30',
    shirt: '#b8a4d8',
    pants: '#4e74b5',
    shoes: '#6e4526',
    blush: '#e89a8a',
    portraitBg: '#e6def3',
  },
  'pai-bella': {
    skin: '#e3b088',
    hair: 'short',
    hairColor: '#5a4a44',
    hairShade: '#6e5e56',
    shirt: '#4e9442',
    pants: '#55545e',
    shoes: '#2a1f2e',
    beard: '#5a4a44',
    glasses: '#3b3a44',
    portraitBg: '#dbe8d4',
  },
  vizinha: {
    skin: '#c99272',
    hair: 'bun',
    hairColor: '#cfcac4',
    hairShade: '#b5aea6',
    shirt: '#e8a24f',
    pants: '#8a5a33',
    shoes: '#6e4526',
    dress: true,
    portraitBg: '#f3e2c4',
  },
};
