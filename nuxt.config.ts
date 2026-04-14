// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-11-08',
    vite: {
        define: {
            'process.env.DEBUG': false,
        },
    },
    modules: [
        '@nuxt/eslint',
        'vuetify-nuxt-module',
        '@pinia/nuxt',
        '@vite-pwa/nuxt',
    ],
    ssr: false,
    eslint: {
        config: {
            standalone: false,
        },
    },
    vuetify: {
        vuetifyOptions: {
            labComponents: true,
        },
    },
    runtimeConfig: {
        // Override it with environment variables starting with NUXT, _ as separator
        // except public ones, these variables can only be read from the server
        public: {
            // public constants can be universally accessed, in both browser and server
        },
    },
})
