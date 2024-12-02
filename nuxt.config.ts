// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  components: { 
    global: true, // Charge tous les composants sans les préfixer avec le nom des dossiers
    dirs: [{ path: '~/components/', pathPrefix: false },],
  },
  runtimeConfig: {
    public: {
      backendUrl: 'http://localhost:3001', // Adresse du backend
      apiKey: 'jkeAjDiY/klacvlUMHMMqlgjFRfWibEDHiD34IRBFG8='
    },
  },
  nitro: {
    devProxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/login': { target: 'http://localhost:3001/login', changeOrigin: true },
      '/gallery': { target: 'http://localhost:3001/gallery', changeOrigin: true },
    },
  },
})
