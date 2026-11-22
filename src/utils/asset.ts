import available from 'virtual:available-assets';

const files = new Set(available);

/**
 * Caminho real de um arquivo de public/: se existir a versão .webp (bem mais leve),
 * usa ela no lugar do .png. Assim o código continua pedindo "x.png".
 */
export function assetPath(file: string): string {
  if (file.endsWith('.png')) {
    const w = file.slice(0, -4) + '.webp';
    if (files.has(w)) return w;
  }
  return file;
}

/** Existe esse arquivo (em .png ou .webp)? */
export function assetExists(file: string): boolean {
  return files.has(assetPath(file));
}

/** URL absoluta pra usar no DOM (img src / background-image). */
export function assetURL(file: string): string {
  return new URL(assetPath(file), document.baseURI).href;
}
