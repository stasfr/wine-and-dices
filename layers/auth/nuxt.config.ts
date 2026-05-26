export default defineNuxtConfig({
  $meta: {
    name: 'auth',
  },
  imports: {
    // @pinia/nuxt only scans the root srcDir's stores by default; opt the
    // layer's stores into the auto-import scan so useAuthStore() is callable
    // anywhere without an explicit import.
    dirs: ['stores'],
  },
});
