import { defineConfig, type Plugin } from 'vite';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const assetsDir = join(root, 'public', 'assets');
const VIRTUAL_ID = 'virtual:available-assets';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(relative(join(root, 'public'), full).split(sep).join('/'));
  }
  return out;
}

/**
 * Expõe a lista de arquivos realmente presentes em public/assets.
 * O PreloadScene só carrega o que existe; o resto vira placeholder.
 * Assim, basta soltar o PNG gerado no ChatGPT na pasta certa.
 */
function availableAssets(): Plugin {
  return {
    name: 'available-assets',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      return `export default ${JSON.stringify(listFiles(assetsDir))};`;
    },
    configureServer(server) {
      const refresh = (file: string) => {
        if (!file.startsWith(assetsDir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.add(assetsDir);
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}

/** Versão do build (commit + data), mostrada na tela de título pra conferir se o site atualizou. */
function buildId(): string {
  let sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7);
  if (!sha) {
    try {
      sha = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
    } catch {
      sha = 'local';
    }
  }
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${sha} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(buildId()) },
  plugins: [availableAssets()],
  resolve: { alias: { '@': join(root, 'src') } },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
  server: { port: 5173 },
});
