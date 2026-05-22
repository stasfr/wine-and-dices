import {
  addComponentsDir,
  addServerScanDir,
  createResolver,
  defineNuxtModule,
  addImports,
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

    addImports([
      {
        name: 'IUserListItem',
        from: resolver.resolve('./runtime/app/types'),
        type: true,
      },
      {
        name: 'IUserProfile',
        from: resolver.resolve('./runtime/app/types'),
        type: true,
      },
    ]);
  },
});
