<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
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

/* ---------------- MOCK CATEGORIES ---------------- */

const optionGroups = ref([
  {
    id: crypto.randomUUID(),
    name: 'Where?',
    options: [
      { id: crypto.randomUUID(), label: 'Italian restaurant' },
      { id: crypto.randomUUID(), label: 'Japanese restaurant' }
    ]
  },
  {
    id: crypto.randomUUID(),
    name: 'When?',
    options: [
      { id: crypto.randomUUID(), label: 'Friday at 20:00' },
      { id: crypto.randomUUID(), label: 'Saturday at 14:00' }
    ]
  }
])

const newCategoryName = ref('')
const optionDrafts = reactive({})

function ensureOptionDraft(groupId) {
  if (!(groupId in optionDrafts)) {
    optionDrafts[groupId] = ''
  }
}

function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return

  optionGroups.value.push({
    id: crypto.randomUUID(),
    name,
    options: []
  })

  newCategoryName.value = ''
}

function removeCategory(groupId) {
  optionGroups.value = optionGroups.value.filter(g => g.id !== groupId)
  delete optionDrafts[groupId]
}

function addOption(groupId) {
  ensureOptionDraft(groupId)

  const value = optionDrafts[groupId].trim()
  if (!value) return

  const group = optionGroups.value.find(g => g.id === groupId)
  if (!group) return

  group.options.push({
    id: crypto.randomUUID(),
    label: value
  })

  optionDrafts[groupId] = ''
}

function removeOption(groupId, optionId) {
  const group = optionGroups.value.find(g => g.id === groupId)
  if (!group) return

  group.options = group.options.filter(o => o.id !== optionId)
}

/* ---------------- HELPERS ---------------- */

function formatDate(value) {
  if (!value) return '—'

  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function normalizeStatus(value) {
  const raw = String(value || '').toLowerCase()

  if (['complete', 'completed', 'closed', 'done', 'finalized'].includes(raw)) {
    return 'Complete'
  }

  if (['draft'].includes(raw)) {
    return 'Draft'
  }

  return 'Shared (Open)'
}

async function shareRoundtable(rt) {
  const url = `${window.location.origin}/roundtables/${rt.id}`

  try {
    if (navigator.share) {
      await navigator.share({
        title: rt.title,
        text: rt.question,
        url
      })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Round table link copied to clipboard.')
    }
  } catch (error) {
    console.error('Error sharing round table:', error)
  }
}
</script>

<template>
  <v-container class="py-6">
    <template v-if="!isChildRoute">

      <div class="mb-6">
        <h1 class="text-h5">Round Table</h1>
        <p class="text-medium-emphasis">
          Add categories and options for the group.
        </p>
      </div>

      <v-alert
        v-if="!rt"
        type="warning"
        variant="tonal"
      >
        Round table not found.
      </v-alert>

      <template v-else>

        <!-- ROUND TABLE CARD -->
        <v-card class="rt-card mb-6">
          <v-card-item class="rt-card-item">
            <template #title>
              <div class="rt-card-header">
                <div class="rt-card-heading">
                  <div class="rt-card-title">
                    {{ rt.title }}
                  </div>

                  <div class="rt-card-meta">
                    <span>Created: {{ formatDate(rt.createdAt) }}</span>
                    <span>Last Update: {{ formatDate(rt.updatedAt) }}</span>
                  </div>
                </div>

                <v-chip
                  size="small"
                  variant="tonal"
                  class="rt-card-status"
                >
                  {{ normalizeStatus(rt.status) }}
                </v-chip>
              </div>
            </template>
          </v-card-item>

          <v-card-text class="rt-card-description">
            <div class="mb-4">
              <strong>Question</strong><br />
              {{ rt.question || '—' }}
            </div>

            <div>
              <strong>Description</strong><br />
              {{ rt.description || '—' }}
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="tertiary"
              variant="flat"
              @click="shareRoundtable(rt)"
            >
              <v-icon>mdi-share-variant</v-icon>
            </v-btn>

            <v-btn
              to="/roundtables"
              variant="text"
            >
              Back
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- CATEGORIES -->
        <v-card class="rt-card mb-6">
          <v-card-item>
            <v-card-title>Option Categories</v-card-title>
          </v-card-item>

          <v-card-text>

            <!-- ADD CATEGORY -->
            <div class="d-flex ga-3 align-center mb-4">
              <v-text-field
                v-model="newCategoryName"
                placeholder="New category (Where? When? Budget?)"
                variant="outlined"
                density="compact"
                hide-details
                class="flex-grow-1"
                @keyup.enter="addCategory"
              />

              <v-btn color="primary" @click="addCategory">
                Add
              </v-btn>
            </div>

            <!-- CATEGORY LIST -->
            <v-row v-if="optionGroups.length">
              <v-col
                v-for="group in optionGroups"
                :key="group.id"
                cols="12"
                md="6"
              >
                <v-card variant="outlined">
                  <v-card-item>
                    <template #title>
                      <div class="d-flex justify-space-between align-center">
                        <span>{{ group.name }}</span>

                        <v-btn
                          icon
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeCategory(group.id)"
                        >
                          <v-icon size="18">mdi-trash-can-outline</v-icon>
                        </v-btn>
                      </div>
                    </template>
                  </v-card-item>

                  <v-card-text>

                    <!-- OPTIONS -->
                    <v-list v-if="group.options.length" density="compact" class="mb-3">
                      <v-list-item
                        v-for="option in group.options"
                        :key="option.id"
                      >
                        <template #title>
                          <div class="d-flex justify-space-between align-center">
                            <span>{{ option.label }}</span>

                            <v-btn
                              icon
                              size="x-small"
                              variant="text"
                              color="error"
                              @click="removeOption(group.id, option.id)"
                            >
                              <v-icon size="16">mdi-close</v-icon>
                            </v-btn>
                          </div>
                        </template>
                      </v-list-item>
                    </v-list>

                    <v-alert
                      v-else
                      type="info"
                      variant="tonal"
                      class="mb-3"
                    >
                      No options yet.
                    </v-alert>

                    <!-- ADD OPTION -->
                    <div class="d-flex ga-3 align-center">
                      <v-text-field
                        v-model="optionDrafts[group.id]"
                        placeholder="Add option"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="flex-grow-1"
                        @focus="ensureOptionDraft(group.id)"
                        @keyup.enter="addOption(group.id)"
                      />

                      <v-btn
                        color="secondary"
                        @click="addOption(group.id)"
                      >
                        Add
                      </v-btn>
                    </div>

                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-alert
              v-else
              type="info"
              variant="tonal"
            >
              No categories yet.
            </v-alert>

          </v-card-text>
        </v-card>

      </template>
    </template>

    <NuxtPage />
  </v-container>
</template>