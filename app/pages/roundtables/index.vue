<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useUserStore } from '~/stores/user'
import { useRoundtablesStore } from '~/stores/roundtables'

definePageMeta({
  middleware: ['authenticated']
})

const userStore = useUserStore()
const roundtablesStore = useRoundtablesStore()

onMounted(() => {
  userStore.initAuth()
  roundtablesStore.subscribeToMine()
})

onBeforeUnmount(() => {
  roundtablesStore.unsubscribe()
})

const allRoundtables = computed(() => {
  const merged = [
    ...(roundtablesStore.drafts || []).map(rt => ({
      ...rt,
      _derivedStatus: 'draft'
    })),
    ...(roundtablesStore.shared || []).map(rt => ({
      ...rt,
      _derivedStatus: normalizeStatus(rt)
    }))
  ]

  const deduped = new Map()

  for (const rt of merged) {
    deduped.set(rt.id, rt)
  }

  return Array.from(deduped.values())
})

function normalizeStatus(rt) {
  const rawStatus = String(rt.status || '').toLowerCase()

  if (['complete', 'completed', 'closed', 'done', 'finalized'].includes(rawStatus)) {
    return 'complete'
  }

  if (['draft'].includes(rawStatus)) {
    return 'draft'
  }

  return 'shared'
}

function getStatusLabel(rt) {
  const status = rt._derivedStatus || normalizeStatus(rt)

  if (status === 'draft') return 'Draft'
  if (status === 'complete') return 'Complete'
  return 'Shared (Open)'
}

function getStatusColor(rt) {
  const status = rt._derivedStatus || normalizeStatus(rt)
  return status
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

function formatCreatedAt(value) {
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

const editingTitleId = ref(null)
const editingDescriptionId = ref(null)

const tempTitle = ref('')
const tempDescription = ref('')

function startEditTitle(rt) {
  editingTitleId.value = rt.id
  tempTitle.value = rt.title || ''
}

function startEditDescription(rt) {
  editingDescriptionId.value = rt.id
  tempDescription.value = rt.question || ''
}

function cancelTitleEdit() {
  editingTitleId.value = null
  tempTitle.value = ''
}

function cancelDescriptionEdit() {
  editingDescriptionId.value = null
  tempDescription.value = ''
}

async function saveTitle(rt) {
  const nextTitle = tempTitle.value.trim()

  if (!nextTitle) {
    cancelTitleEdit()
    return
  }

  await roundtablesStore.updateRoundtable(rt.id, {
    title: nextTitle,
  })

  cancelTitleEdit()
}

async function saveDescription(rt) {
  const nextQuestion = tempDescription.value.trim()

  await roundtablesStore.updateRoundtable(rt.id, {
    question: nextQuestion,
  })

  cancelDescriptionEdit()
}
</script>

<template>
  <v-container class="py-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4">My Round Tables</h1>
        <p class="text-medium-emphasis">Create, share, and manage your decisions.</p>
      </div>

      <v-btn color="tertiary" to="/roundtables/new">
        <v-icon>mdi-plus-thick</v-icon>
      </v-btn>
    </div>

    <v-alert
      v-if="roundtablesStore.error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ roundtablesStore.error }}
    </v-alert>

    <v-row v-if="allRoundtables.length" class="align-stretch">
      <v-col
        v-for="rt in allRoundtables"
        :key="rt.id"
        cols="12"
        md="6"
        lg="4"
        class="d-flex"
      >
        <v-card class="rt-card d-flex flex-column w-100 h-100">
          <v-card-item class="rt-card-item">
            <template #title>
              <div class="rt-card-header">
                <div class="rt-card-heading">
                  <div class="rt-card-title">
                    <template v-if="editingTitleId === rt.id">
                      <v-text-field
                        v-model="tempTitle"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @keyup.enter="saveTitle(rt)"
                        @keyup.esc="cancelTitleEdit"
                        @blur="saveTitle(rt)"
                      />
                    </template>

                    <template v-else>
                      <div
                        class="rt-inline-editable rt-inline-editable--title"
                        @click="startEditTitle(rt)"
                      >
                        {{ rt.title }}
                      </div>
                    </template>
                  </div>

                  <div class="rt-card-meta">
                    <span>Created: {{ formatCreatedAt(rt.createdAt) }}</span>
                    <span>Last Update: {{ formatCreatedAt(rt.updatedAt) }}</span>
                  </div>
                </div>

                <v-chip
                  :color="getStatusColor(rt)"
                  size="small"
                  variant="tonal"
                  class="rt-card-status"
                >
                  {{ getStatusLabel(rt) }}
                </v-chip>
              </div>
            </template>
          </v-card-item>

          <v-card-text class="rt-card-description flex-grow-1">
            <template v-if="editingDescriptionId === rt.id">
              <v-textarea
                v-model="tempDescription"
                variant="outlined"
                density="compact"
                auto-grow
                hide-details
                rows="3"
                @keyup.esc="cancelDescriptionEdit"
                @blur="saveDescription(rt)"
              />
            </template>

            <template v-else>
              <div
                class="rt-inline-editable rt-inline-editable--description"
                @click="startEditDescription(rt)"
              >
                {{ rt.question }}
              </div>
            </template>
          </v-card-text>

          <v-card-actions>
            <v-btn
              :to="`/roundtables`"
              color="secondary"
              variant="flat"
            >
              Add Options
            </v-btn>

            <v-spacer />

            <v-btn
              color="tertiary"
              variant="flat"
              @click="shareRoundtable(rt)"
            >
              <v-icon>mdi-share-variant</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-else type="info" variant="tonal">
      You do not have any round tables yet.
    </v-alert>
  </v-container>
</template>
