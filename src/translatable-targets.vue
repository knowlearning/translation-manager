<script setup>
  import { computed, ref, reactive, watch } from 'vue'
  import languageCodes from './language-codes.js'

  const TRANSLATION_DOMAIN = 'f74e9cb3-2b53-4c85-9b0c-f1d61b032b3f.localhost:5889'

  const props = defineProps({
    translatableItemId: String
  })

  const languages = ref(['en-us', 'fr', 'es', 'zh-cn'])
  const id = props.translatableItemId
  const currentEditTranslation = ref(null)
  const headers = ref([])
  const items = ref([])

  await loadTranslations()

  watch(
    () => languages.value,
    () => loadTranslations()
  )

  async function loadTranslations() {
    const translations = await Agent.query('translations-for-item', [id, languages.value], TRANSLATION_DOMAIN)

    console.log('translations-for-item', translations)
    const languagePlaceholders = (
      languages
        .value
        .reduce((acc, language) => {
          acc[language] = false
          return acc
        }, {})
    )

    const t = (
      translations
        .reduce((acc, { translatable_target, language, path, is_source, value }) => {
          if (!acc[translatable_target]) acc[translatable_target] = { path: path.slice(1), ...languagePlaceholders }
          if (is_source) acc[translatable_target].source = value

          acc[translatable_target][language] = true

          return acc
        }, {})
    )

    console.log(t)




    headers.value = ['path', ...languages.value]
    items.value = Object.values(t)
  }

  async function loadTranslationEdits() {
    const lang = currentEditTranslation.value

    if (!editData[lang]) {
      editData[lang] = await Agent.state(`translations/${props.translatableItemId}/${lang}`)
    }

    if (languageRows[lang]) {
      Object
        .entries(languageRows[lang])
        .forEach(([key, { value, fallback }]) => {
          if (!editData[lang] && key.startsWith('[') && !fallback) {
            editData[key] = value
          }
        })
    }

    console.log('edit data...', editData)
  }

</script>

<template>
  <div>
    <h1>Translations</h1>
    <v-select
      v-model="languages"
      label="Select languages to show"
      multiple
      chips
      closable-chips
      :headers="headers"
      :items="languageCodes.map(({ code, name }) => ({ title: name, subtitle: code, value: code }))"
    />
    <v-container>
      <v-data-table
        sticky
        :items="items"
        show-select
      >
      </v-data-table>
    </v-container>
  </div>
</template>