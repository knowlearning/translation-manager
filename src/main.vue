<script setup>
  import { ref } from 'vue'
  import TranslatableTargets from './translatable-targets.vue'

  const translatableItems = await Agent.query('translatable-items')
  const translatableItemIds = translatableItems.map(i => i.translatable_item)

  const selected = ref(null)
  const drawer = ref(true)
</script>

<template>
  <v-app>
    <v-main>
      <v-navigation-drawer
        v-model="drawer"
      >
        <v-list>
          <v-list-item
            v-for="id in translatableItemIds"
            :active="id === selected"
            @click="selected = id"
          >
            <v-list-item-title>{{ id }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
      <v-app-bar
        scroll-behavior="elevate"
      >
        <template v-slot:prepend>
          <v-btn
            variant="plain"
            :icon="drawer ? 'fa-solid fa-chevron-left' : 'fa-solid fa-bars'"
            @click="drawer = !drawer"
          />
        </template>
      </v-app-bar>
      <TranslatableTargets
        v-if="selected"
        :key="selected"
        :translatableItemId="selected"
      />
    </v-main>
  </v-app>
</template>

<style scoped>
  .active { background-color: chartreuse; }
</style>