<script setup>
import { computed, onMounted } from 'vue'
import { getDB } from '~/services/fireinit'
import { useUserStore } from '~/stores/user'

onMounted(() => {
  const db = getDB()
  console.log('DB initialized:', !!db)
  userStore.initAuth()
})

const userStore = useUserStore()

const isLoggedIn = computed(() => !!userStore.uid)

</script>

<template>
  <v-container class="py-12">
    <v-row align="center">
      <!-- LEFT: IMAGE -->
      <v-col cols="12" md="6" class="d-flex justify-center mb-8 mb-md-0">
        <v-img
          src="/images/roundtable-hero.jpg"
          alt="RoundTable app preview"
          max-width="560"
          rounded="lg"
          cover
        />
      </v-col>

      <!-- RIGHT: TEXT -->
      <v-col cols="12" md="6" class="pl-md-10">

        <div class="font-weight-bold mb-6">
          Make decisions, not threads.
        </div>

        <p class="text-body-1 mb-4">
          RoundTable is a shared space for group decisions.
        </p>

        <p class="text-body-2 mb-4">
          Most group decisions get lost in messy chats, RoundTable brings a simple 
          structure to help groups decide clearly together.
        </p>

        <p class="text-body-1 text-medium-emphasis mb-4">
          You create a roundtable, invite others, and lay out options.
          Each option is visible, comparable, and open to discussion.  
          Nothing gets lost in a scroll.
        </p>

        <p class="text-body-1 text-medium-emphasis mb-4">
          When it’s time to decide, everyone votes. Results update in real time, and
          everyone sees where things stand. Once voting closes, the outcome 
          is clear and shared by everyone.
        </p>

        <p class="text-body-1 text-medium-emphasis mb-0">
          RoundTable doesn’t try to replace conversation. It gives it shape so
          groups can move faster from talking to deciding.
        </p>
        <br>
        <v-btn
          v-if="!isLoggedIn"
          color="primary"
          variant="flat"
          to="/login"
        >
          Sign in
        </v-btn>

        <v-btn
          v-else
          color="primary"
          variant="flat"
          to="/roundtables"
        >
          Go to my round tables!
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
