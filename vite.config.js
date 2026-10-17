import { defineConfig } from 'vite';

// Inline the (small) stylesheet into index.html so first paint doesn't wait on a CSS request.
function inlineCSS() {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = Object.values(bundle).find((f) => f.fileName === 'index.html');
      if (!html) return;
      let src = html.source.toString();
      for (const [name, file] of Object.entries(bundle)) {
        if (!name.endsWith('.css')) continue;
        const css = file.source.toString().replace(/url\((['"]?)\.\//g, 'url($1./assets/');
        const tag = new RegExp(`<link[^>]+href="\\.?/?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`);
        if (tag.test(src)) { src = src.replace(tag, `<style>${css}</style>`); delete bundle[name]; }
      }
      // preload the display + body fonts so the headline doesn't reflow on swap
      const fonts = Object.keys(bundle).filter((n) => n.endsWith('.woff2') && /(fjalla|source-sans-3-400)/.test(n));
      const links = fonts.map((n) => `<link rel="preload" as="font" type="font/woff2" href="./${n}" crossorigin>`).join('');
      src = src.replace('<meta name="theme-color"', `${links}<meta name="theme-color"`);
      html.source = src;
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [inlineCSS()],
  build: { target: 'es2020', assetsInlineLimit: 0, cssCodeSplit: false },
});
