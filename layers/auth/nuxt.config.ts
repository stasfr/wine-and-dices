export default defineNuxtConfig({
  $meta: {
    name: 'auth',
  },
  imports: {
    dirs: ['stores'],
  },
  components: [
    { path: './components/activation', pathPrefix: false },
    { path: './components/auth', pathPrefix: false },
    { path: './components/profile', pathPrefix: false },
    { path: './components/ui', pathPrefix: false },
  ],
});
