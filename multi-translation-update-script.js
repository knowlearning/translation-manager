const translationsJson = {
  "8188b820-15cb-11ef-bc70-79185abca486": {
    "name": {
      "th": "เกรดขั้นต่ำ",
      "fr": "Niveau minimal"
    }
  }
}

  const sourceLanguage = 'en'
  const targetType = 'application/json;type=translatable_target'
  const translationType = 'application/json;type=translation'

  function resolvePath(value, path) {
    return path.reduce((current, key) => current?.[key], value)
  }

  for (const [itemId, fields] of Object.entries(translationsJson)) {
    const item = await Agent.state(itemId)
    const itemMetadata = await Agent.metadata(itemId)

    for (const [field, translations] of Object.entries(fields)) {
      const path = [itemId, field]
      const sourceString = resolvePath(item, [field])

      if (typeof sourceString !== 'string') {
        throw new Error(`Missing source string at ${JSON.stringify(path)}`)
      }

      const targetScope =
        `translatable_target/${JSON.stringify(path)}`

      const targetMetadata = await Agent.metadata(targetScope)
      const target = await Agent.state(targetScope)

      if (targetMetadata.active_type !== targetType) {
        targetMetadata.active_type = targetType
      }

      target.source_language = sourceLanguage
      target.source_string = sourceString
      target.path = path

      if (itemMetadata.ii != null) {
        target.ii = itemMetadata.ii
      }

      // Persist the target first so translations are considered current.
      await Agent.response()

      const valuesToWrite = {
        ...translations,
        [sourceLanguage]: sourceString,
      }

      for (const [language, translationValue] of Object.entries(valuesToWrite)) {
        const translationScope =
          `translation/${targetMetadata.id}/${language}`

        const translationMetadata =
          await Agent.metadata(translationScope)

        if (translationMetadata.active_type !== translationType) {
          translationMetadata.active_type = translationType
        }

        const translation = await Agent.state(translationScope)

        translation.translatable_target = targetMetadata.id
        translation.language = language
        translation.value = translationValue

        console.log({
          path,
          language,
          value: translationValue,
        })
      }

      await Agent.response()
    }
  }