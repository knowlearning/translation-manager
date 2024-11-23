import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Main from './main.vue'
import Agent from '@knowlearning/agents'

import { createVuetify } from 'vuetify'
import { aliases, fa } from 'vuetify/iconsets/fa'
import vuetifyKnowLearningTheme from './vuetify-knowlearning-theme.js'
import * as components from 'vuetify/components' //  TODO: trim down imports
import * as directives from 'vuetify/directives' //  TODO: trim down imports

import 'vuetify/styles'
import '@fortawesome/fontawesome-free/css/all.css'
import './style.css'

window.Agent = Agent

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Main },
    { path: '/:translatableItemId', component: Main }
  ]
})

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
  .use(router)
  .use(vuetify)
  .mount('#app')
