<script setup>
  import { reactive, ref, watch } from 'vue'
  import JSONEditor from './json-editor.vue'
  import languageCodes from './language-codes.js'

  const TRANSLATION_DOMAIN = 'f74e9cb3-2b53-4c85-9b0c-f1d61b032b3f.localhost:5889'
  const CURRENT_DOMAIN = window.location.host
  const { auth: { user: CURRENT_USER } } = await Agent.environment()

  const props = defineProps({
    translatableItemId: String
  })

  const languages = ref(['en-us', 'fr', 'es', 'zh-cn'])
  const id = props.translatableItemId
  const headers = ref([])
  const items = ref([])
  const editing = ref(false)
  const edits = reactive({})
  const openEditor = ref(null)
  const editingSource = ref(false)
  const itemMd = ref(null)
  const itemState = ref(null)

  Agent
    .metadata(id)
    .then(async md => {
      if (md.domain === CURRENT_DOMAIN && md.owner === CURRENT_USER) {
        itemState.value = await Agent.state(id)
      }
      itemMd.value = md
    })
    .catch(() => {})

  await loadTranslations()

  watch(
    () => languages.value,
    () => loadTranslations()
  )

  async function loadTranslations() {
    const translations = await Agent.query('translations-for-item', [id, languages.value], TRANSLATION_DOMAIN)

    console.log('translations-for-item', translations)
    const languagePlaceholders = Object.fromEntries(languages.value.map(k => [k, null]))

    let sourceLanguage

    const t = (
      translations
        .reduce((acc, { translatable_target, language, path, is_source, value }) => {
          if (!acc[translatable_target]) {
            acc[translatable_target] = {
              path: path.slice(1),
              translatable_item: path[0],
              translatable_target,
              ...languagePlaceholders
            }
          }
          if (is_source) {
            acc[translatable_target].source = value
            sourceLanguage = language
          }

          acc[translatable_target][language] = value

          return acc
        }, {})
    )

    console.log(t)

    headers.value = [
      { title: 'path', key: 'path' },
      { title: `${sourceLanguage} (source)`, key: 'source' },
      ...languages
        .value
        .filter(language => language !== 'source' && language !== sourceLanguage)
        .map(language => ({
          title: language,
          key: language
        }))
    ]
    items.value = Object.values(t)
    console.log('headers', headers.value)
    console.log('items', items.value)
  }

  async function saveLanguageTranslation({translatable_item, translatable_target}, language, value) {
    const state = await Agent.state(`translations/${translatable_item}/${language}`)
    state[translatable_target] = value
    console.log('saved?', state)
  }

  function editKey({ path }, language) { return JSON.stringify([...path, language]) }

  async function save(item, language) {
    // TODO: ensure optimistic update applied
    const editedValue = edits[editKey(item, language)]
    item[language] = editedValue
    saveLanguageTranslation(item, language, editedValue)
    openEditor.value = null
  }

  async function updateSource(jsonObject) {
    const sourceState = itemState.value
    const { source_language } = JSON.parse(JSON.stringify(sourceState.translations))
    Object
      .keys(sourceState)
      .filter(key => jsonObject[key] === undefined)
      .forEach(key => delete sourceState[key])

    const paths = getAllPaths(jsonObject)

    Object
      .assign(
        sourceState,
        {
          ...jsonObject,
          translations: {
            source_language,
            paths
          }
        }
      )
    console.log(sourceState)

    editingSource.value = false
    await loadTranslations()
  }

  function getAllPaths(obj, currentPath = []) {
    const paths = []
    if (typeof obj !== "object" || obj === null) {
      paths.push(currentPath)
      return paths
    }

    if (Array.isArray(obj)) {
      obj.forEach((element, index) => {
        paths.push(
          ...getAllPaths(element, [...currentPath, index])
        )
      })
      return paths
    }

    for (const key in obj) {
      const newPath = [...currentPath, key]
      paths.push(...getAllPaths(obj[key], newPath))
    }

    return paths
  }

</script>

<template>
  <v-container class="fill-height d-flex flex-column">
    <v-container class="flex-grow-0">
      <v-autocomplete
        v-model="languages"
        label="Select languages to show"
        variant="solo-filled"
        multiple
        chips
        closable-chips
        :items="languageCodes.map(({ code, name }) => ({ title: name, subtitle: code, value: code }))"
      />
      <v-switch
        v-model="editing"
        color="primary"
        :label="editing ? 'Editing' : 'Edit'"
      />
      <v-btn
        v-if="
          editing
          && !editingSource
          && itemMd
          && itemMd.domain === CURRENT_DOMAIN
          && itemMd.owner === CURRENT_USER
        "
        @click="editingSource = true"
        text="Edit Source"
      />
    </v-container>
    <JSONEditor
      v-if="
        itemMd.domain === CURRENT_DOMAIN
        && itemMd.owner === CURRENT_USER
      "
      v-show="editing && editingSource"
      @save="updateSource"
      @cancel="editingSource = false"
      :jsonObject="itemState"
    />
    <v-data-table
      v-if="!editingSource"
      class="flex-grow-1"
      :headers="headers"
      :items="items"
      :items-per-page="-1"
      hide-default-footer
      show-slect
    >
      <template v-slot:item.path="{ value }">
        {{ value }}
      </template>
      <template v-slot:item.source="{ value }">
        {{ value }}
      </template>
      <template
        v-for="language in languages"
        v-slot:[`item.${language}`]="{ value, item }"
      >
        <div
          v-if="editing && openEditor === editKey(item, language)"
        >
          <v-textarea
            variant="outlined"
            autofocus
            v-model="edits[editKey(item, language)]"
            @keydown.shift.enter="save(item, language)"
          />
          <v-btn
            text="compare"
          />
          <v-btn
            text="cancel"
            @click="openEditor = null"
          />
          <v-btn
            text="save"
            @click="save(item, language)"
          />
        </div>
        <div v-else>
          {{ value }}
          <v-btn
            v-if="editing && !openEditor"
            variant="plain"
            size="x-small"
            icon="fa fa-pencil"
            @click="() => {
              const key = editKey(item, language)
              openEditor = key
              edits[key] = edits[key] || value
            }"
          />
        </div>
      </template>
    </v-data-table>
  </v-container>
</template>
