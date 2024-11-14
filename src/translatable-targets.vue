<script setup>
  const TRANSLATION_DOMAIN = 'f74e9cb3-2b53-4c85-9b0c-f1d61b032b3f.localhost:5889'

  const props = defineProps({
    translatableItemId: String
  })

  const lang = '' // ask for all translations with empty prefix
  const id = props.translatableItemId
  const translations = await Agent.query('translation-set', [id, lang], TRANSLATION_DOMAIN)
  console.log('TRANSLATIONS', translations)


  const pathObject = translations.reduce((acc, { path }) => {
    const p = path.slice(1)
    let ref = acc
    for (let i=0; i<p.length; i++) {
      const field = p[i]
      if (!ref[field]) ref[field] = p.length === i+1 ? true : {}
      ref = ref[field]
    }
    return acc
  }, {})

  const buildHeaders = path => ([key, value]) => {
    const header = { title: key, key: JSON.stringify([...path, key]), align: 'center' }

    if (value !== true) {
      header.children = Object.entries(value).map(buildHeaders([...path, key]))
    }

    return header
  }

  const headers = [
    { title: 'Language', key: 'language' },
    ...Object.entries(pathObject).map(buildHeaders([]))
  ]

  const languageRows = {}

  translations.forEach(({ path, language, value, fallback }) => {
    if (!languageRows[language]) languageRows[language] = {}

    languageRows[language][JSON.stringify(path.slice(1))] = { value, fallback }
  })

  console.log('lang rows', languageRows)

  const items = Object.entries(languageRows).map(([language, values]) => {
    values.language = language
    return values
  })

  console.log('ITEMS!!!!!!', items)
</script>

<template>
  <div>
    <h1>Translations</h1>

    <v-container>
      <v-data-table
        sticky
        :headers="headers"
        :items="items"
      >
        <template v-slot:item.path="{ item }">
          {{ item.path.slice(1) }}
        </template>
        <template v-slot:item.value="{ item }">
          {{ item.value }}
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>