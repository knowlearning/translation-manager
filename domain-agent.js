  import Agent from 'npm:@knowlearning/agents/deno.js'

  const TRANSLATION_TYPE = 'application/json;type=translation'

  Agent.on('child', child => {
    const { environment: { user } } = child
    Agent.log(`GOT CHILD CONNECTION!!!!!!!! ${user}`)

    child.on('mutate', async ({ scope, id }) => {
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