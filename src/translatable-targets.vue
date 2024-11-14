<script setup>
import { computed } from 'vue';

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
    const header = { title: key, value: key, align: 'center' }

    if (value !== true) {
      header.children = Object.entries(value).map(buildHeaders([...path, key]))
    }
    else header.value = JSON.stringify([...path, key])

    return header
  }

  const headers = [
    { title: 'Language', value: 'language' },
    ...Object.entries(pathObject).map(buildHeaders([]))
  ]

  console.log(headers)

  const languageRows = {}

  translations.forEach(({ path, language, value, fallback }) => {
    if (!languageRows[language]) languageRows[language] = {}

    languageRows[language][JSON.stringify(path.slice(1).map(v => v+''))] = { value, fallback }
  })

  console.log('lang rows', languageRows)

  const items = Object.entries(languageRows).map(([language, values]) => {
    values.language = { value: language }
    return values
  })

  console.log('ITEMS!!!!!!', items)

  const flatHeaders = computed(() => flattenHeaders(headers))

  function flattenHeaders(headers) {
    return headers.map(header => {
      if (header.children) return flattenHeaders(header.children)
      else return header
    }).flat()
  }

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
        <template v-slot:item="{ item }">
          <tr>
            <td v-for="header in flatHeaders" :key="header.value">
              {{ item[header.value].value }}
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>