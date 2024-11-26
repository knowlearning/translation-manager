import Agent from 'npm:@knowlearning/agents/deno.js'

const TRANSLATABLE_TARGET_TYPE = 'application/json;type=translatable_target'

Agent.on('child', child => {
  const { environment: { user } } = child
  Agent.log(`GOT CHILD CONNECTION!!!!!!!! ${user}`)

  child.on('mutate', async ({ id }) => {
    if (await isTranslatableItem(id)) {
      Agent.log('GOT TRANSLATABLE ITEM', id)
      await handleTranslatableItem(id)
    }
  })
})

async function handleTranslatableItem(id) {
  const itemState = await TranslationAgent.state(id)
  itemState.translations.paths.forEach(async path => {
    const translatableTargetName = `translatable_target/${JSON.stringify([id, ...path])}`
    Agent.log('GETTING METADATA', translatableTargetName)
    const translatableTargetMetadata = await TranslationAgent.metadata(translatableTargetName)
    Agent.log('GOT METADATA', JSON.parse(JSON.stringify(translatableTargetMetadata)))

    if (translatableTargetMetadata.active_type !== TRANSLATABLE_TARGET_TYPE) {
      translatableTargetMetadata.active_type = TRANSLATABLE_TARGET_TYPE
    }

    Agent.log('GETTING STATE', translatableTargetName)
    const translatableTarget = await TranslationAgent.state(translatableTargetName)
    Agent.log('GOT STATE', JSON.stringify(translatableTarget))

    const { source_language } = itemState.translations

    translatableTarget.source_language = source_language
    translatableTarget.path = [id, ...path]
  })
}

async function isTranslatableItem(id) {
  const state = await Agent.state(id)
  //  TODO: validate schema
  return !!state.translations
}
