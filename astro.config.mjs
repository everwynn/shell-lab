import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://everwynn.github.io/',
  base: '/shell-lab/',
  trailingSlash: 'always',
  integrations: [vue(), tailwind()],
  output: 'static',
});
