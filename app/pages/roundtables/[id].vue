<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useRoundtablesStore } from '~/stores/roundtables'

import { useQuestions } from '~/composables/useQuestions'

definePageMeta({
  middleware: ['authenticated']
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const roundtablesStore = useRoundtablesStore()

const roundtableId = computed(() => String(route.params.id || ''))
const roundtable = computed(() => roundtablesStore.currentRoundtable || null)

const {
  questions,
  addQuestion,
  removeQuestion,
  editQuestionTitle,
  toggleVoteForOption,
} = useQuestions(`roundtables/${roundtableId.value}`)
const newTitle = ref('')
function handleAdd() {
  addQuestion({
    title: newTitle.value
  })
  newTitle.value = ''
}

onMounted(() => {
  roundtablesStore.watchRoundtable(roundtableId.value)
})

onBeforeUnmount(() => {
  roundtablesStore.unwatchRoundtable()
})

const participantIds = computed(() =>
  Array.isArray(roundtable.value?.participantIds)
    ? roundtable.value.participantIds
    : []
)

const isOwner = computed(() => {
  if (!roundtable.value || !userStore.uid) return false
  return roundtable.value.ownerId === userStore.uid
})

const isParticipant = computed(() => {
  if (!userStore.uid) return false
  return participantIds.value.includes(userStore.uid)
})

const canJoin = computed(() => {
  if (!roundtable.value) return false
  if (isOwner.value) return false
  if (isParticipant.value) return false
  return true
})

function goBack() {
  router.push('/roundtables')
}

function formatDate(value) {
  if (!value) return '—'

  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

async function shareRoundtable(rt) {
  if (!rt) return

  try {
    await roundtablesStore.shareRoundtable(rt)
  } catch (err) {
    console.error('Error sharing round table:', err)
  }
}

async function leaveRoundTable() {
  if (!roundtable.value) return

  try {
    await roundtablesStore.unsubscribeFromRoundtable(roundtable.value.id)
    await router.replace(`/roundtables`)
  } catch (err) {
    console.error('Unsubscribe failed:', err)
  }
}
</script>

<template>
  <v-container class="py-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4">Round Table</h1>
        <p class="text-medium-emphasis mb-0">
          Review this decision and join if you want to participate.
        </p>
      </div>

      <v-btn
        color="secondary"
        variant="flat"
        @click="goBack"
      >
        Back
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

    <v-progress-linear
      v-if="roundtablesStore.currentRoundtableLoading && !roundtable"
      indeterminate
      class="mb-4"
    />

    <template v-if="roundtable">
      <v-card class="rt-card d-flex flex-column w-100">
        <v-card-item class="rt-card-item">
          <template #title>
            <div class="rt-card-header">
              <div class="rt-card-heading">
                <div
                  class="rt-inline-editable rt-inline-editable--title d-flex align-center justify-space-between"
                >
                  <span>{{ roundtable.title }}</span>

                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="roundtable.status === 'Open' ? 'success' : 'error'"
                  >
                    <v-icon size="14">
                      {{ roundtable.status === 'Open' ? 'mdi-lock-open' : 'mdi-lock' }}
                    </v-icon>
                    {{ roundtable.status }}
                  </v-chip>
                </div>

                <div class="rt-card-meta">
                  <span>Created: {{ formatDate(roundtable.createdAt) }}</span>
                  <span>Last update: {{ formatDate(roundtable.updatedAt) }}</span>
                </div>
              </div>

              
            </div>
          </template>
        </v-card-item>

        <v-card-text class="pt-0">
          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">Decision</div>
            <div class="rt-inline-editable rt-inline-editable--description rt-inline-editable--readonly">
              {{ roundtable.decision || 'No decision text provided.' }}
            </div>
          </div>


          <div
            v-if="roundtable.description"
            class="mb-4"
          >
            <div class="text-subtitle-2 mb-2">Description</div>
            <div class="rt-inline-editable rt-inline-editable--description rt-inline-editable--readonly">
              {{ roundtable.description }}
            </div>
          </div>

          <div>
            <input v-model="newTitle" placeholder="Question title" />
            <button @click="handleAdd">Add Question</button>
            <template v-for="q in questions" :key="q.id">
              <QuestionCard
                :question="q"
                @editQuestionTitle="(title) => editQuestionTitle(q.id, title)"
                @removeQuestion="removeQuestion(q.id)"
                @toggleVote="(optionId) => toggleVoteForOption(q.id, optionId)"
              />
            </template>
          </div>
          <div class="d-flex flex-wrap ga-2 mb-3">
            <v-chip size="small" variant="outlined">
              Owner: {{ roundtable.ownerName || 'Unknown user' }}
            </v-chip>

            <v-chip size="small" variant="outlined">
              Participants: {{ participantIds.length }}
            </v-chip>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-if="isOwner"
              size="small"
              color="primary"
              variant="tonal"
            >
              You are the owner
            </v-chip>

            <v-chip
              v-else-if="isParticipant"
              size="small"
              color="primary"
              variant="tonal"
            >
              You joined this round table
            </v-chip>

            <v-chip
              v-else
              size="small"
              color="warning"
              variant="tonal"
            >
              Join this round table to participate!
            </v-chip>
          </div>
        </v-card-text>

        <v-card-actions>

          <v-btn
            v-if="isParticipant"
            color="primary"
            variant="flat"
            disabled
          >
            <v-icon start>mdi-check</v-icon>
            Joined
          </v-btn>

          <v-btn
            v-else-if="isOwner"
            color="primary"
            variant="flat"
            disabled
          >
            <v-icon start>mdi-crown</v-icon>
            Owner
          </v-btn>

          <v-spacer />

          <v-btn
            v-if="isParticipant && !isOwner"
            color="secondary"
            variant="outlined"
            :loading="roundtablesStore.loading"
            @click="leaveRoundTable"
          >
            <v-icon start>mdi-account-remove</v-icon>
            Leave
          </v-btn>

          <v-btn
            v-if="isOwner && roundtable.status == 'Open'"
            color="tertiary"
            variant="flat"
            @click="shareRoundtable(roundtable)"
          >
            <v-icon start>mdi-share-variant</v-icon>
            Share
          </v-btn>
        </v-card-actions>
      </v-card>
      <ResultsRoundtableResults
        v-if="roundtable.status === 'closed'"
        :roundtable-id="roundtableId"
      />
      
    </template>

    <v-alert
      v-else-if="!roundtablesStore.currentRoundtableLoading"
      type="warning"
      variant="tonal"
    >
      Round table not found or you do not have access to it.
    </v-alert>
  </v-container>
</template>