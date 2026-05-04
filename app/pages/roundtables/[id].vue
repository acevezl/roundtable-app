<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useRoundtablesStore } from '~/stores/roundtables'

import { useQuestions } from '~/composables/useQuestions'

definePageMeta({
  middleware: ['authenticated'],
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
  deleteVotes,
  setWinningOption,
} = useQuestions(`roundtables/${roundtableId.value}`)

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
    typeof value?.toDate === 'function' ? value.toDate() : new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
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

async function closeRoundtableVoting(rt) {
  if (!rt) return

  try {
    await roundtablesStore.closeVoting(rt.id)
    for (const q of questions.value) {
      await setWinningOption(q.id)
    }
  } catch (err) {
    console.error('Error closing voting for roundtable:', err)
  }
}

async function leaveRoundTable(rt) {
  if (!rt) return

  try {
    await roundtablesStore.unsubscribeFromRoundtable(rt.id)
    await router.replace(`/roundtables`)
  } catch (err) {
    console.error('Unsubscribe failed:', err)
  }
}
</script>

<template>
  <v-container class="pa-0 pa-md-6">
    <div class="pa-2">
      <!-- RoundTable info -->
      <div class="rt-card-header">
        <div v-if="roundtable" class="rt-card-heading mb-1">
          <div
            class="rt-inline-editable rt-inline-editable--title d-flex align-center justify-space-between"
          >
            <h1 class="text-h4 pa-a my-0 my-md-3">
              {{ roundtable.title }}
            </h1>

            <v-chip
              size="x-small"
              variant="tonal"
              :color="roundtable.status.toLowerCase() === 'open' ? 'success' : 'error'"
            >
              <v-icon size="14">
                {{
                  roundtable.status.toLowerCase() === 'open' ? 'mdi-lock-open' : 'mdi-lock'
                }}
              </v-icon>
              <span class="status">{{ roundtable.status }}</span>
            </v-chip>
          </div>

          <div
            class="rt-inline-editable rt-inline-editable--description rt-inline-editable--readonly"
          >
            {{ roundtable.decision || 'No decision text provided.' }}
          </div>

          <div class="rt-card-meta">
            <span>Created: {{ formatDate(roundtable.createdAt) }}</span>
            <span>Last update: {{ formatDate(roundtable.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <div class="d-flex flex-wrap align-center ga-2">
        <template v-if="roundtable">
          <v-chip
            v-if="isParticipant && !isOwner"
            size="small"
            color="primary"
            variant="tonal"
          >
            You joined this round table
          </v-chip>

          <v-chip
            v-else-if="!isOwner"
            size="small"
            color="warning"
            variant="tonal"
          >
            Join this round table to participate!
          </v-chip>

          <div class="d-flex flex-wrap ga-2">
            <v-chip size="small" variant="outlined">
              Owner: {{ roundtable.ownerName || 'Unknown user' }}
            </v-chip>

            <v-chip size="small" variant="outlined">
              Participants: {{ participantIds.length }}
            </v-chip>
          </div>
        </template>
      </div>
      <div class="d-flex flex-wrap align-center ga-2">
        <v-card-actions class="ma-0 pa-0">
          <v-btn
            v-if="isOwner && roundtable.status.toLowerCase() == 'open'"
            color="tertiary"
            variant="flat"
            @click="shareRoundtable(roundtable)"
          >
            <v-icon start>mdi-share-variant</v-icon>
            Share
          </v-btn>

          <v-btn
            v-if="isOwner && roundtable.status.toLowerCase() == 'open'"
            color="primary"
            variant="flat"
            @click="closeRoundtableVoting(roundtable)"
          >
            <v-icon start>mdi-progress-close</v-icon>
            Close Voting
          </v-btn>

          <v-btn v-if="isParticipant && !isOwner" color="primary" variant="flat" disabled>
            <v-icon start>mdi-check</v-icon>
            Joined
          </v-btn>
          <v-btn v-else-if="isOwner" color="primary" variant="flat" disabled>
            <v-icon start>mdi-crown</v-icon>
            Owner
          </v-btn>
          <v-btn
            v-if="isParticipant && !isOwner"
            color="secondary"
            variant="outlined"
            :loading="roundtablesStore.loading"
            @click="leaveRoundTable(roundtable)"
          >
            <v-icon start>mdi-account-remove</v-icon>
            Leave
          </v-btn>
          <v-btn color="secondary" variant="flat" @click="goBack"> Back </v-btn>
        </v-card-actions>
        
      </div>
      <ResultsRoundtableResults
        v-if="roundtable.status.toLowerCase() === 'closed'"
        :roundtable-id="roundtableId"
      />
      <template v-if="roundtable && roundtable.status.toLowerCase() !== 'closed'">
        Add question:
        <InlineAdd
          placeholder="Add question"
          @submit="(title) => addQuestion({ title })"
        />
      </template>
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
      <v-card class="rt-card d-flex flex-column w-100 px-2 py-0">
        <v-card-text class="pa-0">
          <div v-if="roundtable.description" class="mb-4">
            <div class="text-subtitle-2 mb-2">Description</div>
            <div
              class="rt-inline-editable rt-inline-editable--description rt-inline-editable--readonly"
            >
              {{ roundtable.description }}
            </div>
          </div>

          <div>
            <template v-for="q in questions" :key="q.id">
              <QuestionCard
                :question="q"
                :disabled="roundtable.status.toLowerCase() === 'closed'"
                @editQuestionTitle="(title) => editQuestionTitle(q.id, title)"
                @removeQuestion="removeQuestion(q.id)"
                @toggleVote="(optionId) => toggleVoteForOption(q.id, optionId)"
                @removeOption="(optionId) => deleteVotes(q.id, optionId)"
                @setWinningVote="(optionId) => setWinningOption(q.id, optionId)"
              />
            </template>
          </div>
        </v-card-text>
      </v-card>
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
