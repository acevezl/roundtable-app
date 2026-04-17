<script setup>
import { computed, onMounted, onBeforeUnmount, ref, reactive, nextTick } from 'vue'
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

function getCurrentUserId() {
  return (
    userStore.user?.uid ||
    userStore.currentUser?.uid ||
    userStore.profile?.id ||
    null
  )
}

function isOwner(rt) {
  const currentUserId = getCurrentUserId()

  return (
    rt?.ownerId === currentUserId ||
    rt?.owner?.id === currentUserId ||
    rt?.createdBy === currentUserId ||
    rt?.userId === currentUserId
  )
}

const editingTitleId = ref(null)
const editingDescriptionId = ref(null)

const tempTitle = ref('')
const tempDescription = ref('')

function startEditTitle(rt) {
  if (!isOwner(rt)) return
  editingTitleId.value = rt.id
  tempTitle.value = rt.title || ''
}

function startEditDescription(rt) {
  if (!isOwner(rt)) return
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
  if (!isOwner(rt)) return

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
  if (!isOwner(rt)) return

  const nextQuestion = tempDescription.value.trim()

  await roundtablesStore.updateRoundtable(rt.id, {
    question: nextQuestion,
  })

  cancelDescriptionEdit()
}

const creating = ref(false)
const creatingBusy = ref(false)
const createTitleRef = ref(null)

const newRoundtable = reactive({
  title: '',
  question: ''
})

const displayRoundtables = computed(() => {
  const list = [...allRoundtables.value]

  if (creating.value) {
    list.unshift({
      id: '__creating__',
      _isCreating: true
    })
  }

  return list
})

async function startCreating() {
  if (creating.value) return

  creating.value = true

  await nextTick()
  createTitleRef.value?.focus?.()
}

function cancelCreating() {
  creating.value = false
  newRoundtable.title = ''
  newRoundtable.question = ''
}

async function createRoundtable() {
  const title = newRoundtable.title.trim()
  const question = newRoundtable.question.trim()

  if (!title || creatingBusy.value) return

  creatingBusy.value = true

  try {
    await roundtablesStore.createRoundtable({
      title,
      question,
      status: 'draft'
    })

    cancelCreating()
  } catch (error) {
    console.error('Error creating round table:', error)
  } finally {
    creatingBusy.value = false
  }
}

const deletingId = ref(null)

async function deleteRoundtable(rt) {
  if (!rt?.id || deletingId.value) return
  if (!isOwner(rt)) return

  const confirmed = window.confirm(`Delete "${rt.title}"? This cannot be undone.`)
  if (!confirmed) return

  deletingId.value = rt.id

  try {
    await roundtablesStore.deleteRoundtable(rt.id)
  } catch (error) {
    console.error('Error deleting round table:', error)
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <v-container class="py-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4">My Round Tables</h1>
        <p class="text-medium-emphasis">Create, share, and manage your decisions.</p>
      </div>

      <v-btn
        color="tertiary"
        :disabled="creating"
        @click="startCreating"
      >
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

    <v-row v-if="displayRoundtables.length" class="align-stretch">
      <v-col
        v-for="rt in displayRoundtables"
        :key="rt.id"
        cols="12"
        md="6"
        lg="4"
        class="d-flex"
      >
        <v-card
          v-if="rt._isCreating"
          class="rt-card rt-card--creating d-flex flex-column w-100 h-100"
        >
          <v-card-item class="rt-card-item">
            <template #title>
              <div class="rt-card-header">
                <div class="rt-card-heading">
                  <div class="rt-card-title">
                    <v-text-field
                      ref="createTitleRef"
                      v-model="newRoundtable.title"
                      variant="outlined"
                      density="compact"
                      hide-details
                      placeholder="Round table title"
                      @keyup.enter="createRoundtable"
                      @keyup.esc="cancelCreating"
                    />
                  </div>

                  <div class="rt-card-meta">
                    <span>New draft</span>
                  </div>
                </div>

                <v-chip
                  color="draft"
                  size="small"
                  variant="tonal"
                  class="rt-card-status"
                >
                  New
                </v-chip>
              </div>
            </template>
          </v-card-item>

          <v-card-text class="rt-card-description flex-grow-1">
            <v-textarea
              v-model="newRoundtable.question"
              variant="outlined"
              density="compact"
              auto-grow
              hide-details
              rows="3"
              placeholder="What decision are you making?"
              @keyup.esc="cancelCreating"
            />
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="secondary"
              variant="flat"
              @click="cancelCreating"
              :disabled="creatingBusy"
            >
              Cancel
            </v-btn>

            <v-spacer />

            <v-btn
              color="tertiary"
              variant="flat"
              :disabled="creatingBusy || !newRoundtable.title.trim()"
              @click="createRoundtable"
            >
              <v-icon v-if="!creatingBusy">mdi-check</v-icon>
              <span v-else>Creating...</span>
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card
          v-else
          class="rt-card d-flex flex-column w-100 h-100"
        >
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
                        :class="{ 'rt-inline-editable--readonly': !isOwner(rt) }"
                        @click="startEditTitle(rt)"
                      >
                        {{ rt.title }}                        
                      </div>
                    </template>
                  </div>

                  <v-btn
                    v-if="isOwner(rt)"
                    icon
                    variant="text"
                    size="tiny"
                    color="error"
                    :loading="deletingId === rt.id"
                    @click.stop="deleteRoundtable(rt)"
                  >
                    <v-icon size="18">mdi-trash-can-outline</v-icon>
                  </v-btn>

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
                :class="{ 'rt-inline-editable--readonly': !isOwner(rt) }"
                @click="startEditDescription(rt)"
              >
                {{ rt.question }}
              </div>
            </template>
          </v-card-text>

          <v-card-actions>
            <v-btn
              :to="`/roundtables/${rt.id}`"
              color="secondary"
              variant="flat"
            >
              Add Options
            </v-btn>

            <v-spacer />

            <v-btn
              :to="`/roundtables/${rt.id}`"
              color="primary"
              variant="flat"
            >
              <v-icon>mdi-eye-outline</v-icon>
            </v-btn>

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

    <v-row v-else-if="creating" class="align-stretch">
      <v-col cols="12" md="6" lg="4" class="d-flex">
        <v-card class="rt-card rt-card--creating d-flex flex-column w-100 h-100">
          <v-card-item class="rt-card-item">
            <template #title>
              <div class="rt-card-header">
                <div class="rt-card-heading">
                  <div class="rt-card-title">
                    <v-text-field
                      ref="createTitleRef"
                      v-model="newRoundtable.title"
                      variant="outlined"
                      density="compact"
                      hide-details
                      placeholder="Round table title"
                      @keyup.enter="createRoundtable"
                      @keyup.esc="cancelCreating"
                    />
                  </div>

                  <div class="rt-card-meta">
                    <span>New draft</span>
                  </div>
                </div>

                <v-chip
                  color="draft"
                  size="small"
                  variant="tonal"
                  class="rt-card-status"
                >
                  New
                </v-chip>
              </div>
            </template>
          </v-card-item>

          <v-card-text class="rt-card-description flex-grow-1">
            <v-textarea
              v-model="newRoundtable.question"
              variant="outlined"
              density="compact"
              auto-grow
              hide-details
              rows="3"
              placeholder="What decision are you making?"
              @keyup.esc="cancelCreating"
            />
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="secondary"
              variant="flat"
              @click="cancelCreating"
              :disabled="creatingBusy"
            >
              Cancel
            </v-btn>

            <v-spacer />

            <v-btn
              color="tertiary"
              variant="flat"
              :disabled="creatingBusy || !newRoundtable.title.trim()"
              @click="createRoundtable"
            >
              <v-icon v-if="!creatingBusy">mdi-check</v-icon>
              <span v-else>Creating...</span>
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