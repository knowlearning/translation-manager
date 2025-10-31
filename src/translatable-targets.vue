<script setup>
  import { reactive, ref, watch } from 'vue'
  import ContentReference from './content-reference.vue';

  const CURRENT_DOMAIN = window.location.host
  const TRANSLATION_TYPE = 'application/json;type=translation'
  const TRANSLATABLE_TARGET_TYPE = 'application/json;type=translatable_target'

  const { auth: { user: CURRENT_USER } } = await Agent.environment()

  const props = defineProps({
    translatableItemId: String,
    languages: Array,
    editing: Boolean
  })

  const id = props.translatableItemId
  const headers = ref([])
  const items = ref([])
  const edits = reactive({})
  const openEditor = ref(null)
  const editingSource = ref(false)
  const addingNewTarget = ref(false)
  const newTargetPath = ref('')
  const newTargetValue= ref('')

  await loadTranslations()

  watch(
    () => props.languages,
    () => loadTranslations()
  )

  async function loadTranslations() {
    const translations = await Agent.query('translations-for-item', [id, props.languages])

    console.log('translations-for-item', translations)
    const languagePlaceholders = Object.fromEntries(props.languages.map(k => [k, null]))

    let sourceLanguage

    const t = (
      translations
        .reduce((acc, { translatable_target, language, path, is_current, is_source, value }) => {
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

          acc[translatable_target][language] = {
            value,
            is_current
          }

          return acc
        }, {})
    )

    console.log(t)

    headers.value = [
      { title: 'path', key: 'path' },
      { title: `${sourceLanguage} (source)`, key: 'source' },
      ...props
        .languages
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
    const value = edits[editKey(item, language)]
    item[language] = { is_current: true, value }
    saveLanguageTranslation(item, language, value)
    openEditor.value = null
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

  async function saveNewTarget() {
    let path = [id]
    try {
      path.push(...JSON.parse(newTargetPath.value))
    }
    catch (e) {
      path.push(newTargetPath.value)
    }
    const name = `translatable_target/${JSON.stringify(path)}`
    const target = await Agent.state(name)
    const md = await Agent.metadata(name)
    if (md.active_type !== TRANSLATABLE_TARGET_TYPE) md.active_type = TRANSLATABLE_TARGET_TYPE

    target.path = path
    target.source_language = 'en' // TODO: pull reasonable setting here
    target.source_string = newTargetValue.value

    newTargetPath.value = ''
    newTargetValue.value = ''

    await Agent.response()
    loadTranslations()
  }

</script>

<template>
  <v-container>
    <div class="text-h3 mt-8">
      <ContentReference :id="id" />
    </div>
    <div class="text-h8 mb-8">
      {{ id }}
    </div>
    <v-data-table
      :headers="headers"
      :items="items"
      :items-per-page="-1"
      hide-default-footer
    >
      <template v-slot:body.prepend>
        <tr
          v-if="editing"
          key="edit-row"
        >
          <td>
            <v-text-field
              v-if="addingNewTarget"
              variant="outlined"
              autofocus
              auto-grow
              hide-details
              min-width="128px"
              v-model="newTargetPath"
              @keydown.shift.enter="saveNewTarget"
            />
            <v-btn
              v-else
              variant="plain"
              size="x-small"
              icon="fa fa-add"
              @click="() => {
                addingNewTarget = true
                openEditor = null
              }"
            />
          </td>
          <td>
            <v-textarea
              v-if="addingNewTarget"
              variant="outlined"
              autofocus
              auto-grow
              rows="1"
              v-model="newTargetValue"
              hide-details
              @keydown.shift.enter="saveNewTarget"
            >
              <template v-slot:append>
                <v-btn
                  v-if="addingNewTarget"
                  text="Save"
                  @click="saveNewTarget"
                />
                <v-btn
                  v-if="addingNewTarget"
                  text="Cancel"
                  @click="() => {
                    addingNewTarget = false
                  }"
                />
              </template>
            </v-textarea>
          </td>
          <td
            v-for="header in headers.slice(2)"
          >
          </td>
        </tr>
      </template>
      <template v-slot:item.path="{ value }">
        <v-chip
          v-for="v in value"
          class="mr-1"
        >
          {{v}}
        </v-chip>
      </template>
      <template v-slot:item.source="{ value }">
        {{ value }}
      </template>
      <template
        v-for="language in props.languages"
        v-slot:[`item.${language}`]="{ value, item }"
      >
        <div
          v-if="props.editing && openEditor === editKey(item, language)"
        >
          <v-textarea
            variant="outlined"
            autofocus
            v-model="edits[editKey(item, language)]"
            @keydown.shift.enter="save(item, language)"
            auto-grow
            rows="1"
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
          <v-icon
            v-if="value && !value.is_current"
            class="mr-2"
            icon="fa-solid fa-clock-rotate-left"
            tooltip="woo"
          />
          {{ value ? value.value : '' }}
          <v-btn
            v-if="props.editing && !openEditor"
            variant="plain"
            size="x-small"
            icon="fa fa-pencil"
            @click="() => {
              const key = editKey(item, language)
              openEditor = key
              edits[key] = edits[key] || (value ? value.value : '')
              addingNewTarget = false
            }"
          />
        </div>
      </template>
    </v-data-table>
  </v-container>
</template>

<style>
</style>
