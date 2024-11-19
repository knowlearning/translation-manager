import { createApp } from 'vue'
import App from './App.vue'
import Agent from '@knowlearning/agents'

import { createVuetify } from 'vuetify'
import { aliases, fa } from 'vuetify/iconsets/fa'
import vuetifyKnowLearningTheme from './vuetify-knowlearning-theme.js'
import * as components from 'vuetify/components' //  TODO: trim down imports
import * as directives from 'vuetify/directives' //  TODO: trim down imports

import 'vuetify/styles'
import './style.css'

window.Agent = Agent

const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'vuetifyKnowLearningTheme',
      themes: {
        vuetifyKnowLearningTheme,
      },
    },
    icons: {
      defaultSet: 'fa',
      aliases,
      sets: { fa }
    }
  })
  

createApp(App)
  .use(vuetify)
  .mount('#app')
