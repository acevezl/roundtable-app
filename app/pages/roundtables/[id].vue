<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useRoundtablesStore } from '~/stores/roundtables'

definePageMeta({
  middleware: ['authenticated']
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const roundtablesStore = useRoundtablesStore()

const roundtableId = computed(() => String(route.params.id || ''))
const roundtable = computed(() => roundtablesStore.currentRoundtable || null)

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

async function joinRoundtable() {
  if (!roundtable.value) return

  try {
    await roundtablesStore.subscribeToRoundtable(roundtable.value.id)
  } catch (err) {
    console.error('Join failed:', err)
  }
}

async function shareRoundtable(rt) {
  if (!rt) return

  const url = `${window.location.origin}/roundtables/${rt.id}`

  try {
    if (navigator.share) {
      await navigator.share({
        title: rt.title,
        text: rt.decision,
        url
      })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard')
    }
  } catch (err) {
    console.error(err)
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
                <div class="rt-card-title">
                  {{ roundtable.title }}
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
            v-if="canJoin"
            color="primary"
            variant="flat"
            :loading="roundtablesStore.loading"
            @click="joinRoundtable"
          >
            <v-icon start>mdi-account-plus</v-icon>
            Join
          </v-btn>

          <v-btn
            v-else-if="isParticipant"
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
            v-if="isOwner"
            color="tertiary"
            variant="flat"
            @click="shareRoundtable(roundtable)"
          >
            <v-icon start>mdi-share-variant</v-icon>
            Share
          </v-btn>
        </v-card-actions>
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