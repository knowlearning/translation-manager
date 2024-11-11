  import Agent, { getAgent } from 'npm:@knowlearning/agents/deno.js'

  const TRANSLATION_TYPE = 'application/json;type=translation'

  Agent.on('child', child => {
    const { environment: { user } } = child
    //  TODO: validate user is a domain agent
    Agent.log(`GOT CHILD CONNECTION!!!!!!!! ${user}`)
    const TranslatedItemDomainAgent = getAgent(user)

    child.on('mutate', async ({ scope, patch, id }) => {
      if (scope.startsWith('translatable_target/')) {
          const  { source_language, source_string } = await Agent.state(id)
          const translationScopeName = `translation/${id}/${source_language}`
          const translationScopeMetadata = await Agent.metadata(translationScopeName)

          if (translationScopeMetadata.active_type !== TRANSLATION_TYPE) {
              translationScopeMetadata.active_type = TRANSLATION_TYPE
          }

          const translationScope = await Agent.state(translationScopeName)

          translationScope.translatable_target = id
          translationScope.language = source_language
          translationScope.value = source_string
      }
    })
  })
