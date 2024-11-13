<script setup>
  import { ref } from 'vue'
  import TranslatableTargets from './translatable-targets.vue'

  const translatableItems = await Agent.query('translatable-items')
  const translatableItemIds = translatableItems.map(i => i.translatable_item)

  const selectedTranslatableItemId = ref(null)
</script>

<template>
  <div>
    <div
      v-for="id in translatableItemIds"
      :class="{ active: selectedTranslatableItemId === id }"
      @click="selectedTranslatableItemId = id"
    >
      {{ id }}
    </div>
    <TranslatableTargets
      v-if="selectedTranslatableItemId"
      :key="selectedTranslatableItemId"
      :translatableItemId="selectedTranslatableItemId"
    />
  </div>
</template>

<style scoped>
  .active { background-color: chartreuse; }
</style>