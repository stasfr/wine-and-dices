import {
  addComponentsDir,
  addServerScanDir,
  createResolver,
  defineNuxtModule,
  addImports,
} from 'nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'dice-throne-games',
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
        name: 'ICreateGameBody',
        from: resolver.resolve('./runtime/app/types'),
        type: true,
      },
      {
        name: 'GameMode',
        from: resolver.resolve('./runtime/app/types'),
        type: true,
      },
      {
        name: 'IGameParticipantDetail',
        from: resolver.resolve('./runtime/app/types'),
        type: true,
      },
      {
        name: 'IGameTeam',
        from: resolver.resolve('./runtime/app/types'),
        type: true,
      },
      {
        name: 'IGameListItem',
        from: resolver.resolve('./runtime/app/types'),
        type: true,
      },
      {
        name: 'IGameDetail',
        from: resolver.resolve('./runtime/app/types'),
        type: true,
      },
    ]);
  },
});
