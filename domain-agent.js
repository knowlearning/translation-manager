  import Agent from 'npm:@knowlearning/agents/deno.js'

  const TRANSLATION_TYPE = 'application/json;type=translation'
  const TRANSLATABLE_TARGET_TYPE = 'application/json;type=translatable_target'

  Agent.on('child', child => {
    const { environment: { user } } = child
    Agent.log(`GOT CHILD CONNECTION!!!!!!!! ${user}`)

    child.on('mutate', async ({ scope, id, patch }) => {
      if (scope.startsWith('translatable_target/')) {
        //  TODO: validate user is a domain agent with rights to access
        const  { source_language, source_string } = await Agent.state(id)
        await setTranslation(id, source_language, source_string)
      }
      else if (scope.startsWith('translations/')) {
        const [,, language] = scope.split('/')

        const paths = await Agent.state(id)

        // TODO: smarter updating based on patch data
        await Promise.all(
          Object
            .entries(paths)
            .map(async ([translatable_target, language_string]) => {
              return setTranslation(translatable_target, language, language_string)
            })
        )
      }
      else if (patch.find(({ path }) => path[0] === 'translations')) {
        Agent.log('TRANSLATIONS PATCH', scope, patch, id)
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
    itemState.translations.paths.forEach(async path => {
      const translatableTargetName = `translatable_target/${JSON.stringify([id, ...path])}`
      Agent.log('GETTING METADATA', translatableTargetName)
      const translatableTargetMetadata = await Agent.metadata(translatableTargetName)
      Agent.log('GOT METADATA', JSON.parse(JSON.stringify(translatableTargetMetadata)))

      if (translatableTargetMetadata.active_type !== TRANSLATABLE_TARGET_TYPE) {
        translatableTargetMetadata.active_type = TRANSLATABLE_TARGET_TYPE
      }

      Agent.log('GETTING STATE', translatableTargetName)
      const translatableTarget = await Agent.state(translatableTargetName)
      Agent.log('GOT STATE', JSON.stringify(translatableTarget))

      const { source_language } = itemState.translations

      translatableTarget.source_language = source_language
      translatableTarget.path = [id, ...path]
      Agent.log('RESOLVING PATH', [...path])
      const source_string = resolvePath([...path], itemState)
      Agent.log('GOT SOURCE STRING', translatableTargetName, source_string)
      if (source_string) {
        translatableTarget.source_string = source_string
        await setTranslation(
          translatableTargetMetadata.id,
          source_language,
          source_string
        )
      }
    })
  }
