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
  ],
  css: ['~/assets/css/main.css'],

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
    smtpUser: '',
    smtpPassword: '',
    clientPort: '',
    clientUrl: '',
    clientProtocol: '',
  },
});