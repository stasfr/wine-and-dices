import {
  addServerScanDir,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
} from 'nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'auth',
  },
  setup() {
    const resolver = createResolver(import.meta.url);

    addServerScanDir(resolver.resolve('./runtime/server'));

    addTypeTemplate(
      {
        src: resolver.resolve('./types/auth.d.ts'),
        filename: 'types/auth.d.ts',
      },
      { nitro: true, nuxt: true },
    );
  },
});
