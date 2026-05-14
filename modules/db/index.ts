import { addServerScanDir, createResolver, defineNuxtModule } from 'nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'db',
  },
  setup() {
    const resolver = createResolver(import.meta.url);

    addServerScanDir(resolver.resolve('./runtime/server'));
  },
});
