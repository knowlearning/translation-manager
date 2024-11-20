  import Agent from 'npm:@knowlearning/agents/deno.js'

  const TRANSLATION_TYPE = 'application/json;type=translation'

  Agent.on('child', child => {
    const { environment: { user } } = child
    Agent.log(`GOT CHILD CONNECTION!!!!!!!! ${user}`)

    child.on('mutate', async ({ scope, id }) => {
      if (scope.startsWith('translatable_target/')) {
        //  TODO: validate user is a domain agent with rights to access
        const  { source_language, source_string } = await Agent.state(id)
        const translationScope = await getTranslationScope(id, source_language)

        translationScope.translatable_target = id
        translationScope.language = source_language
        translationScope.value = source_string
      }
      else if (scope.startsWith('translations/')) {
        const [,, language] = scope.split('/')

        const paths = await Agent.state(id)

        // TODO: smarter updating based on patch data
        await Promise.all(
          Object
            .entries(paths)
            .map(async ([translatable_target, value]) => {
              const translationScope = await getTranslationScope(translatable_target, language)

              translationScope.translatable_target = translatable_target
              translationScope.language = language
              translationScope.value = value
            })
        )
      }
    })
  })

  async function getTranslationScope(id, lang) {
    const name = `translation/${id}/${lang}`
    const metadata = await Agent.metadata(name)

    if (metadata.active_type !== TRANSLATION_TYPE) metadata.active_type = TRANSLATION_TYPE

    return Agent.state(name)
  }