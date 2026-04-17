// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-11-08',

  css: [
    '~/assets/css/roundtable.css',
  ],

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
        theme: {
            defaultTheme: 'light',
                themes: {
                        light: {
                            colors: {
                                // Core brand
                                primary: '#2f3e46',          // deep desaturated blue-gray
                                secondary: '#e16b2c',        // warm muted taupe
                                tertiary: '#c010c6',         // soft olive (adds personality without shouting)

                                // Surfaces
                                background: '#ffffff',       // pure white
                                surface: '#f8f9fa',          // soft off-white (cards)

                                // Semantic states
                                error: '#d64545',            // refined red (less harsh than pure red)
                                success: '#3a7d44',          // natural green
                                warning: '#d97706',          // muted amber/orange
                                info: '#3b82f6',             // clean modern blue (kept slightly vibrant)

                                // Process States
                                draft: '#333333',
                                active: '#489f55',
                                closed: '#952571',

                                // Borders (this is where good UI separates itself)
                                'border-gray': '#cbd5e1',    // bluish gray (much nicer than flat gray)
                                'border-black': '#1f2933',   // soft black, not pure black

                                // Background variants (pastel, subtle, elegant)
                                'error-background': '#fdecec',
                                'success-background': '#edf7ed',
                                'warning-background': '#fff4e5',
                                'info-background': '#eff6ff',
                                }
                        },
                    },
            },
        },
  },

  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || '',
      firebaseDatabaseId: process.env.NUXT_PUBLIC_FIREBASE_DATABASE_ID || '',
      useEmulator: process.env.NUXT_PUBLIC_USE_EMULATOR || 'false',
    },
  },
})