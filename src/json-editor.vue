<script setup>
  import { ref, watch } from "vue"

  const props = defineProps({ jsonObject: Object })
  const emit = defineEmits(['save'])

  const copy = JSON.parse(JSON.stringify(props.jsonObject))
  delete copy.translations

  const error = ref(null)
  const jsonString = ref(JSON.stringify(copy, null, 2))

  watch(() => jsonString.value, () => {
    try  {
      JSON.parse(jsonString.value)
      error.value = null
    }
    catch (e) {
      error.value = e
    }
  })

</script>

<template>
  <v-container
    class="flex-grow-1"
  >
    <v-btn
      :disabled="!!error"
      @click="$emit('save', JSON.parse(jsonString))"
      text="Save"
    />
    <v-btn
      @click="$emit('cancel')"
      text="Cancel"
    />
    <span v-if="error">
      {{ error }}
    </span>
    <v-textarea
      v-model="jsonString"
      variant="outlined"
      auto-grow
    />
  </v-container>
</template>