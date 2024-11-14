<script setup>
  const TRANSLATION_DOMAIN = 'f74e9cb3-2b53-4c85-9b0c-f1d61b032b3f.localhost:5889'

  const props = defineProps({
    translatableItemId: String
  })

  const lang = '' // ask for all translations with empty prefix
  const id = props.translatableItemId
  const translations = await Agent.query('translation-set', [id, lang], TRANSLATION_DOMAIN)
  console.log('TRANSLATIONS', translations)
</script>

<template>
  <div>
    <h1>Translations</h1>

    <v-container>
      <v-data-table sticky :items="translations"></v-data-table>
    </v-container>
  </div>
</template>