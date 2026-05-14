import {
  addComponentsDir,
  addServerScanDir,
  createResolver,
  defineNuxtModule,
} from 'nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'users',
  },
  setup() {
    const resolver = createResolver(import.meta.url);

    addComponentsDir({
      path: resolver.resolve('./runtime/app/components'),
      pathPrefix: false,
    });

    addServerScanDir(resolver.resolve('./runtime/server'));
  },
});
