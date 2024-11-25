<script setup>
  import { ref, reactive } from 'vue'
  import TranslatableTargets from './translatable-targets.vue'
  import ContentReference from'./content-reference.vue'
  import { useRouter } from 'vue-router'
  import languageCodes from './language-codes.js'

  const router = useRouter()
  const translatableItems = await Agent.query('translatable-items')
  const translatableItemIds = reactive(translatableItems.map(i => i.translatable_item))
  const editing = ref(false)
  const languages = ref(['en-us', 'fr', 'es', 'zh-cn'])

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
        <template v-slot:prepend>
          <v-toolbar
            color="primary"
          >
            <v-menu location="bottom">
              <template v-slot:activator="slot">
                <v-btn
                  class="mr-2"
                  icon="fa-solid fa-gear"
                  v-bind="slot.props"
                />
              </template>
                <v-list>
                  <v-dialog
                    max-width="700"
                    style="
                      margin-top: 32px !important;
                      align-items: flex-start !important;
                    "
                  >
                    <template v-slot:activator="{ props: activatorProps }">
                      <v-list-item
                        title="Select Languages"
                        prepend-icon="fa-solid fa-language"
                        v-bind="activatorProps"
                      />
                    </template>
                    <template v-slot:default="{ isActive }">
                      <v-autocomplete
                        v-model="languages"
                        label="Select languages to show"
                        variant="solo"
                        multiple
                        chips
                        closable-chips
                        :items="languageCodes.map(({ code, name }) => ({ title: name, subtitle: code, value: code }))"
                      />
                    </template>
                  </v-dialog>
                  <v-list-item
                    title="Log Out"
                    prepend-icon="fa-solid fa-sign-out"
                    @click="logOut()"
                  />
                </v-list>
            </v-menu>
            <v-spacer />
            <v-btn
              variant="plain"
              icon="fa-regular fa-pen-to-square"
              @click="createNewItem"
            />
          </v-toolbar>
        </template>
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
          <v-switch
            class="mr-4"
            v-model="editing"
            color="primary"
            hide-details
            label="edit"
          />
          <v-avatar
            class="mr-2"
            :image="env.auth.info.picture"
          />
        </template>
      </v-app-bar>
      <TranslatableTargets
        v-if="selected"
        :key="selected"
        :editing="editing"
        :translatableItemId="selected"
        :languages="languages"
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