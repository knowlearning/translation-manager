<script setup>
  import { computed, reactive } from 'vue'
  import languageCodes from './language-codes.js'

  const TRANSLATION_DOMAIN = 'f74e9cb3-2b53-4c85-9b0c-f1d61b032b3f.localhost:5889'

  const props = defineProps({
    translatableItemId: String
  })

  const lang = '' // ask for all translations with empty prefix
  const id = props.translatableItemId
  const translations = await Agent.query('translation-set', [id, lang], TRANSLATION_DOMAIN)

  console.log(translations)

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

  const sortHeaders = (a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })

  const buildHeaders = (pathObject, path) => (
    Object.entries(pathObject).map(([key, value]) => {
      const header = { title: key, value: key, align: 'center' }

      if (value !== true) {
        header.children = buildHeaders(value, [...path, key])
      }
      else header.value = JSON.stringify([...path, key])

      return header
    }).sort(sortHeaders)
  )

  const headers = [
    { title: 'Source', value: 'source' },
    { title: 'Language', value: 'language' },
    ...buildHeaders(pathObject, [])
  ]

  const languageRows = {}

  translations.forEach(({ path, language, value, fallback, source }) => {
    if (!languageRows[language]) {
      languageRows[language] = {
        source: source ? { value: true } : { value: false }
      }
    }

    languageRows[language][JSON.stringify(path.slice(1).map(v => v+''))] = { value, fallback }
  })

  const items = Object.entries(languageRows).map(([language, values]) => {
    values.language = { value: language }
    console.log(values)
    return values
  })

  const newTranslationData = reactive({})
  items.push(newTranslationData)

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
          <tr v-if="item !== newTranslationData">
            <td v-for="header in flatHeaders" :key="header.value">
              {{ item[header.value].value }}
            </td>
          </tr>
          <tr v-else>
            <td v-for="header in flatHeaders" :key="header.value">
              <span v-if="header.value === 'source'"></span>
              <div v-else-if="header.value === 'language'">
                <v-select
                  label="Language"
                  v-model="newTranslationData['language']"
                  clearable
                  variant="outlined"
                  item-props
                  :items="languageCodes.map(({ code, name }) => {
                    return {
                      title: name,
                      subtitle: code
                    }
                  })"
                >
                </v-select>
                <v-btn
                  v-if="newTranslationData['language']"
                >
                  Save
                </v-btn>
              </div>
              <v-textarea
                v-else
                v-model="newTranslationData[header.value]"
                variant="outlined"
                auto-grow
              />
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>