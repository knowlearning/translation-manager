<script setup>
  import { computed, ref, reactive } from 'vue'
  import languageCodes from './language-codes.js'

  const TRANSLATION_DOMAIN = 'f74e9cb3-2b53-4c85-9b0c-f1d61b032b3f.localhost:5889'

  const props = defineProps({
    translatableItemId: String
  })

  const lang = '' // ask for all translations with empty prefix
  const id = props.translatableItemId
  const translations = await Agent.query('translation-set', [id, lang], TRANSLATION_DOMAIN)

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
    return values
  })

  const currentEditTranslation = ref(null)
  items.push({})

  const flatHeaders = computed(() => flattenHeaders(headers))

  function flattenHeaders(headers) {
    return headers.map(header => {
      if (header.children) return flattenHeaders(header.children)
      else return header
    }).flat()
  }

  const editData = reactive({})

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

    <v-container>
      <v-data-table
        sticky
        :headers="headers"
        :items="items"
      >
        <template v-slot:item="{ item }">
          <tr v-if="Object.keys(item).length">
            <td v-for="header in flatHeaders" :key="header.value">
              {{ item[header.value].value }}
            </td>
          </tr>
          <tr v-else>
            <td
              v-for="header in flatHeaders.slice(1)"
              :key="header.value"
              :colspan="header.value === 'language' ? 2 : 1"
            >
              <div
                v-if="header.value === 'language'"
                style="margin-top: 8px;"
              >
                <v-select
                  label="Edit Language"
                  v-model="currentEditTranslation"
                  clearable
                  variant="outlined"
                  item-props
                  @update:model-value="loadTranslationEdits"
                  :items="languageCodes.map(({ code, name }) => {
                    return {
                      title: name,
                      subtitle: code,
                      value: code
                    }
                  })"
                >
                </v-select>
              </div>
              <div
                v-else-if="currentEditTranslation && editData[currentEditTranslation]"
                style="margin-top: 8px;"
              >
              {{ editData[currentEditTranslation] }}
              {{ header.value }}
                <v-textarea
                  v-model="editData[currentEditTranslation][header.value]"
                  variant="outlined"
                  auto-grow
                />
              </div>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>