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

const allRoundtables = computed(() => roundtablesStore.roundtables || [])

async function shareRoundtable(rt) {
  if (!rt) return

  try {
    await roundtablesStore.shareRoundtable(rt)
  } catch (err) {
    console.error('Error sharing round table:', err)
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

function isParticipant(rt) {
  const currentUserId = getCurrentUserId()

  const ids = Array.isArray(rt?.participantIds)
    ? rt.participantIds
    : []

  return ids.includes(currentUserId)
}

const editingTitleId = ref(null)
const EditingDecisionId = ref(null)

const tempTitle = ref('')
const tempDecision = ref('')

function startEditTitle(rt) {
  if (!isOwner(rt)) return
  editingTitleId.value = rt.id
  tempTitle.value = rt.title || ''
}

function startEditDecision(rt) {
  if (!isOwner(rt)) return
  EditingDecisionId.value = rt.id
  tempDecision.value = rt.decision || ''
}

function cancelTitleEdit() {
  editingTitleId.value = null
  tempTitle.value = ''
}

function cancelDecisionEdit() {
  EditingDecisionId.value = null
  tempDecision.value = ''
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

async function saveDecision(rt) {
  if (!isOwner(rt)) return

  const nextDecision = tempDecision.value.trim()

  await roundtablesStore.updateRoundtable(rt.id, {
    decision: nextDecision,
  })

  cancelDecisionEdit()
}

const creating = ref(false)
const creatingBusy = ref(false)
const createTitleRef = ref(null)

const newRoundtable = reactive({
  title: '',
  decision: ''
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
  newRoundtable.decision = ''
}

async function createRoundtable() {
  const title = newRoundtable.title.trim()
  const decision = newRoundtable.decision.trim()

  if (!title || creatingBusy.value) return

  creatingBusy.value = true

  try {
    await roundtablesStore.createRoundtable({
      title,
      decision
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

          <v-card-text class="rt-card-decision flex-grow-1">
            <v-textarea
              v-model="newRoundtable.decision"
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
                        class="rt-inline-editable rt-inline-editable--title d-flex align-center justify-space-between"
                        :class="{ 'rt-inline-editable--readonly': !isOwner(rt) }"
                        @click="startEditTitle(rt)"
                      >
                        <span>{{ rt.title }}</span>

                        <v-chip
                          size="x-small"
                          variant="tonal"
                          :color="rt.status === 'Open' ? 'success' : 'error'"
                        >
                          <v-icon size="14">
                            {{ rt.status === 'Open' ? 'mdi-lock-open' : 'mdi-lock' }}
                          </v-icon>
                          {{ rt.status }}
                        </v-chip>
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

              </div>
            </template>
          </v-card-item>

          <v-card-text class="rt-card-decision flex-grow-1">
            <template v-if="EditingDecisionId === rt.id">
              <v-textarea
                v-model="tempDecision"
                variant="outlined"
                density="compact"
                auto-grow
                hide-details
                rows="3"
                @keyup.esc="cancelDecisionEdit"
                @blur="saveDecision(rt)"
              />
            </template>

            <template v-else>
              <div
                class="rt-inline-editable rt-inline-editable--decision"
                :class="{ 'rt-inline-editable--readonly': !isOwner(rt) }"
                @click="startEditDecision(rt)"
              >
                {{ rt.decision }}
              </div>
            </template>
          </v-card-text>

          <v-card-actions>
              <v-btn
                v-if="isOwner(rt)"
                color="primary"
                variant="flat"
                disabled
              >
                <v-icon start>mdi-crown</v-icon>
                Owner
              </v-btn>

              <v-btn
                v-else-if="isParticipant(rt)"                
                color="primary"
                variant="flat"
                disabled
              >
                <v-icon start>mdi-check</v-icon>
                Joined
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
              v-if="isOwner && rt.status == 'Open'"
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

          <v-card-text class="rt-card-decision flex-grow-1">
            <v-textarea
              v-model="newRoundtable.decision"
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