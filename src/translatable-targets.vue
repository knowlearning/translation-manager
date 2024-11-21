<script setup>
  import { computed, ref, reactive, watch } from 'vue'
  import languageCodes from './language-codes.js'

  const TRANSLATION_DOMAIN = 'f74e9cb3-2b53-4c85-9b0c-f1d61b032b3f.localhost:5889'

  const props = defineProps({
    translatableItemId: String
  })

  const languages = ref(['en-us', 'fr'])
  const id = props.translatableItemId
  const translations = await Agent.query('translations', [id, languages.value], TRANSLATION_DOMAIN)

  console.log('translations', translations)

  const pathObject = translations.reduce((acc, { path, translatable_target }) => {
    const p = path.slice(1)
    let ref = acc
    for (let i=0; i<p.length; i++) {
      const field = p[i]
      if (!ref[field]) ref[field] = p.length === i+1 ? translatable_target : {}
      ref = ref[field]
    }
    return acc
  }, {})

  const sortHeaders = (a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })

  const buildHeaders = (pathObject, path) => (
    Object.entries(pathObject).map(([key, value]) => {
      const header = { title: key, value: key, align: 'center' }

      if (typeof value !== 'string') {
        header.children = buildHeaders(value, [...path, key])
      }
      else {
        header.value = value
      }

      return header
    }).sort(sortHeaders)
  )

  const headers = [
    { title: 'Source', value: 'is_source' },
    { title: 'Language', value: 'language' },
    ...buildHeaders(pathObject, [])
  ]

  const languageRows = {}

  translations.forEach(({ language, value, is_fallback, is_source, translatable_target }) => {
    if (!languageRows[language]) {
      languageRows[language] = {
        is_source: is_source ? { value: true } : { value: false }
      }
    }

    languageRows[language][translatable_target] = { value, is_fallback }
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
    <v-select
      v-model="languages"
      label="Select languages to show"
      multiple
      chips
      :items="languageCodes.map(({ code, name }) => {
        return { title: name, subtitle: code, value: code }
      })"
    />
    <v-container>
      <v-data-table
        sticky
        :headers="headers"
        :items="items"
      >
        <template v-slot:item="{ item }">
          <tr v-if="Object.keys(item).length">
            <td v-for="header in flatHeaders" :key="header.value">
              {{ item[header.value] ? item[header.value].value : '' }}
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
                />
              </div>
              <div
                v-else-if="currentEditTranslation && editData[currentEditTranslation]"
                style="margin-top: 8px;"
              >
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