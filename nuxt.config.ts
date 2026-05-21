import { fileURLToPath } from 'node:url';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    '@formkit/auto-animate',
    '@pinia/colada-nuxt',
    '@regle/nuxt',
    'nuxt-auth-utils',
    'nuxt-nodemailer',
    '@nuxt/eslint',
  ],

  alias: {
    '#db': fileURLToPath(
      new URL('./modules/db/runtime/server/db', import.meta.url),
    ),
  },
  nodemailer: {
    from: '"Wine and Dices" <sfworking@yandex.ru>',
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
      user: '',
      pass: '',
    },
  },

  css: ['~/assets/css/main.css'],

  imports: {
    dirs: ['queries', 'mutations'],
  },

  runtimeConfig: {
    // Private (server-only)
    nodeEnv: '',
    serverPort: '',
    serverUrl: '',
    serverProtocol: '',
    dbUser: '',
    dbPassword: '',
    dbHost: '',
    dbPort: '',
    dbName: '',
    cookieSecret: '',
    clientPort: '',
    clientUrl: '',
    clientProtocol: '',
  },
});
