import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'roundtable',
      themes: {
        roundtable: {
          dark: false,
          colors: {
            background: '#FFFDEB',
            surface: '#FFFFFF',
            primary: '#7DAACB',
            secondary: '#E8DBB3',
            error: '#CE2626',
            info: '#7DAACB',
            success: '#6E9F7A',
            warning: '#C89B2B',
          },
        },
      },
    },
    defaults: {
      VCard: {
        rounded: 'xl',
        elevation: 0,
      },
      VBtn: {
        rounded: 'lg',
        elevation: 0,
      },
      VTextField: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VTextarea: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VSelect: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VSheet: {
        rounded: 'xl',
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})