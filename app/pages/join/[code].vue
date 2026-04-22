<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { useRoundtablesStore } from '~/stores/roundtables'
import { getDB } from '~/services/fireinit'
import { useUserStore } from '~/stores/user'

definePageMeta({
  middleware: ['authenticated']
})

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const roundtablesStore = useRoundtablesStore()

const shareCode = computed(() => String(route.params.code || '').trim())

const invite = ref(null)
const loading = ref(false)
const loadError = ref('')


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

async function loadInviteByCode(code) {
  const inviteRef = doc(getDB(), 'roundtableInvites', code)
  const snap = await getDoc(inviteRef)

  if (!snap.exists()) return null

  const loadedInvite = {
    id: snap.id,
    ...snap.data(),
  }

  const expired =
    loadedInvite.status !== 'active' ||
    !loadedInvite.expiresAt ||
    (
      typeof loadedInvite.expiresAt?.toDate === 'function'
        ? loadedInvite.expiresAt.toDate()
        : new Date(loadedInvite.expiresAt)
    ) <= new Date()

  if (expired) return null

  return loadedInvite
}

async function joinRoundtable() {
  if (!invite.value?.roundtableId) return

  try {
    await roundtablesStore.subscribeToRoundtable(invite.value.roundtableId)
    await router.replace(`/roundtables/${invite.value.roundtableId}`)
  } catch (e) {
    console.error('Join failed:', e)
  }
}

onMounted(async () => {
  if (!shareCode.value) {
    loadError.value = 'Invalid share code.'
    return
  }

  loading.value = true
  loadError.value = ''

  try {
    const result = await loadInviteByCode(shareCode.value)

    if (!result) {
      invite.value = null
      loadError.value = 'Invite is invalid or expired.'
      return
    }

    invite.value = result

    // If the user has already joined the roundtable linked to this invite,
    // do not show the invite, send them directly to watch the roundtable
    const rtRef = doc(getDB(), 'roundtables', result.roundtableId)
    const rtSnap = await getDoc(rtRef)

    if (rtSnap.exists()) {
      const data = rtSnap.data()
      const participantIds = Array.isArray(data.participantIds)
        ? data.participantIds
        : []

      if (participantIds.includes(userStore.uid)) {
        await router.replace(`/roundtables/${result.roundtableId}`)
        return
      }
    }

  } catch (e) {
    console.error('Failed to load invite:', e)
    invite.value = null
    loadError.value = 'Failed to load invite.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-container class="py-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4">Round Table Invite</h1>
        <p class="text-medium-emphasis mb-0">
          Review this invite and join if you want to participate.
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

    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ loadError }}
    </v-alert>

    <v-progress-linear
      v-if="loading && !invite"
      indeterminate
      class="mb-4"
    />

    <template v-if="invite">
      <v-card class="rt-card d-flex flex-column w-100">
        <v-card-item class="rt-card-item">
          <template #title>
            <div class="rt-card-header">
              <div class="rt-card-heading">
                <div class="rt-card-title">
                  {{ invite.title }}
                </div>

                <div class="rt-card-meta">
                  <span>Created: {{ formatDate(invite.createdAt) }}</span>
                  <span>Expires: {{ formatDate(invite.expiresAt) }}</span>
                </div>
              </div>
            </div>
          </template>
        </v-card-item>

        <v-card-text class="pt-0">
          <div class="d-flex flex-wrap ga-2 mb-3">
            <v-chip size="small" variant="outlined">
              Owner: {{ invite.ownerName || 'Unknown user' }}
            </v-chip>

            <v-chip size="small" variant="outlined">
              Status: {{ invite.status || 'unknown' }}
            </v-chip>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip
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
            color="primary"
            variant="flat"
            :loading="roundtablesStore.loading"
            :disabled="roundtablesStore.loading"
            @click="joinRoundtable"
          >
            <v-icon start>mdi-account-plus</v-icon>
            Join
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>

    <v-alert
      v-else-if="!loading"
      type="warning"
      variant="tonal"
    >
      Invite not found, expired, or you do not have access to it.
    </v-alert>
  </v-container>
</template>