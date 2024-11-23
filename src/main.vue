<script setup>
  import { ref, reactive } from 'vue'
  import TranslatableTargets from './translatable-targets.vue'
  import ContentReference from'./content-reference.vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const translatableItems = await Agent.query('translatable-items')
  const translatableItemIds = reactive(translatableItems.map(i => i.translatable_item))

  console.log('ROUTER PARAMS', router.currentRoute?.value?.params)

  const selected = ref(router.currentRoute?.value?.params?.translatableItemId)
  const drawer = ref(true)
  const env = await Agent.environment()

  const loggedIn = env.auth.provider !== 'anonymous'

  async function createNewItem() {
    const id = Agent.uuid()
    const state = await Agent.state(id)
    state.name = 'Wooo?'
    state.translations = {
      source_language: 'en-us',
      paths: [
        ['name']
      ]
    }
    selected.value = id
    translatableItemIds.unshift(id)
  }

function logOut() {
  Agent.logout()
}

function logIn() {
  Agent.login()
}
</script>

<template>
  <v-app v-if="loggedIn">
    <v-main>
      <v-navigation-drawer
        v-model="drawer"
      >
        <v-toolbar>
          <v-spacer />
          <v-btn
            variant="plain"
            icon="fa-regular fa-pen-to-square"
            @click="createNewItem"
          />
        </v-toolbar>
        <v-list>
          <v-list-item
            v-for="id in translatableItemIds"
            :active="id === selected"
            @click="() => {
              selected = id
              router.push(`/${id}`)
            }"
          >
            <v-list-item-title>
              <ContentReference
                :key="id"
                :id="id"
              />
            </v-list-item-title>
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
        <template v-slot:append>
          <v-menu location="bottom">
            <template v-slot:activator="slot">
              <v-avatar
                class="mr-2"
                :image="env.auth.info.picture"
                v-bind="slot.props"
              />
            </template>
            <v-list>
              <v-list-item
                title="Log Out"
                prepend-icon="fa-solid fa-sign-out"
                @click="logOut()"
              />
            </v-list>
          </v-menu>
        </template>
      </v-app-bar>
      <TranslatableTargets
        v-if="selected"
        :key="selected"
        :translatableItemId="selected"
      />
    </v-main>
  </v-app>
  <v-app v-else>
    <v-btn
      text="Log in"
      @click="logIn"
    />
  </v-app>
</template>

<style scoped>
  .active { background-color: chartreuse; }
</style>