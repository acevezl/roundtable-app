<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRoundtablesStore } from '~/stores/roundtables'

definePageMeta({
  middleware: ['authenticated']
})

const route = useRoute()
const store = useRoundtablesStore()

onMounted(() => {
  store.subscribeToMine()
})

onBeforeUnmount(() => {
  store.unsubscribe()
})

const rt = computed(() => store.getById(route.params.id))
const isChildRoute = computed(() => route.path.endsWith('/edit'))
</script>

<template>
  <v-container class="py-6">
    <template v-if="!isChildRoute">
      <div class="mb-6">
        <h1 class="text-h4 mb-2">Round Table</h1>
        <p class="text-medium-emphasis">
          Review your round table details.
        </p>
      </div>

      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <v-alert
            v-if="!rt"
            type="warning"
            variant="tonal"
          >
            Round table not found.
          </v-alert>

          <v-card v-else>
            <v-card-text class="pa-6">
              <v-text-field
                :model-value="rt.title"
                label="Title"
                variant="outlined"
                class="mb-4"
                readonly
                disabled
              />

              <v-textarea
                :model-value="rt.question"
                label="Question"
                variant="outlined"
                rows="3"
                auto-grow
                class="mb-4"
                readonly
                disabled
              />

              <v-textarea
                :model-value="rt.description || ''"
                label="Description"
                variant="outlined"
                rows="4"
                auto-grow
                class="mb-4"
                readonly
                disabled
              />

              <v-text-field
                :model-value="rt.status"
                label="Status"
                variant="outlined"
                class="mb-6"
                readonly
                disabled
              />

              <div class="d-flex flex-wrap ga-3">
                <v-btn
                  v-if="rt.status === 'draft'"
                  :to="`/roundtables/${rt.id}/edit`"
                  color="primary"
                >
                  Edit
                </v-btn>

                <v-btn
                  to="/roundtables"
                  variant="text"
                >
                  Back to list
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <NuxtPage />
  </v-container>
</template>