export default defineNuxtConfig({
  $meta: {
    name: 'auth',
  },
  imports: {
    dirs: ['stores'],
  },
  components: [
    { path: '~/layers/auth/components/activation', pathPrefix: false },
    { path: '~/layers/auth/components/auth', pathPrefix: false },
    { path: '~/layers/auth/components/profile', pathPrefix: false },
    { path: '~/layers/auth/components/ui', pathPrefix: false },
  ],
});
