  import Agent from 'npm:@knowlearning/agents/deno.js'

  const TRANSLATION_TYPE = 'application/json;type=translation'
  const TRANSLATABLE_TARGET_TYPE = 'application/json;type=translatable_target'

  Agent.on('child', child => {
    const { environment: { user } } = child
    Agent.log(`GOT CHILD CONNECTION!!!!!!!! ${user}`)

    child.on('mutate', async ({ scope, id, patch }) => {
      if (scope.startsWith('translatable_target/')) {
        //  TODO: validate user is a domain agent with rights to set
        const  { source_language, source_string } = await Agent.state(id)
        await setTranslation(id, source_language, source_string)
      }
      else if (scope.startsWith('translations/')) {
        const [,, language] = scope.split('/')

        const paths = await Agent.state(id)
        Agent.log('TRANSLATIONS PATCH', patch)

        const { op, path: [translatable_target], value } = patch[0]

        if (op === 'add' || op === 'replace') {
          setTranslation(translatable_target, language, value)
        }
        else if (op === 'remove') {
          setTranslation(translatable_target, language, null)
        }
      }
      else if (await isTranslatableItem(id)) {
        await handleTranslatableItem(id)
      }
    })
  })

  async function setTranslation(id, language, string) {
    const scope = await getTranslationScope(id, language)

    scope.translatable_target = id
    scope.language = language
    scope.value = string
  }

  async function getTranslationScope(id, lang) {
    const name = `translation/${id}/${lang}`
    const metadata = await Agent.metadata(name)

    if (metadata.active_type !== TRANSLATION_TYPE) metadata.active_type = TRANSLATION_TYPE

    return Agent.state(name)
  }

  function resolvePath(path, value) {
    while (path.length && value) value = value[path.shift()]
    return value
  }

  async function handleTranslatableItem(id) {
    const itemState = await Agent.state(id)
    const itemMetadata = await Agent.metadata(id)
    await Promise.all(itemState.translations.paths.map(async path => {
      const translatableTargetName = `translatable_target/${JSON.stringify([id, ...path])}`
      const translatableTargetMetadata = await Agent.metadata(translatableTargetName)

      if (translatableTargetMetadata.active_type !== TRANSLATABLE_TARGET_TYPE) {
        translatableTargetMetadata.active_type = TRANSLATABLE_TARGET_TYPE
      }

      const translatableTarget = await Agent.state(translatableTargetName)

      const { source_language } = itemState.translations

      translatableTarget.source_language = source_language
      translatableTarget.path = [id, ...path]
      translatableTarget.ii = itemMetadata.ii
      const source_string = resolvePath([...path], itemState)
      if (source_string) {
        translatableTarget.source_string = source_string
        await setTranslation(
          translatableTargetMetadata.id,
          source_language,
          source_string
        )
      }
    }))
  }

  const sessions = {}
  async function isTranslatableItem(id) {
    if (sessions[id]) return false

    const state = await Agent.state(id)
    const { name } = await Agent.metadata(id)
    if (name === 'sessions') sessions[id] = true

    //  TODO: validate schema
    return !!state.translations
  }
