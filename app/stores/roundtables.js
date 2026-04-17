// RoundTable Domain

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { getDB } from '~/services/fireinit'
import { useUserStore } from '~/stores/user'
import { useFirestoreCollection } from '~/composables/useFirestoreCollection'

function makeShareCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed letters / numbers that could be confused depending on font: IO10
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }

  return out
}

export const useRoundtablesStore = defineStore('roundtables', () => {
  const userStore = useUserStore()
  const { $firestore } = useNuxtApp()

  const collection = useFirestoreCollection('roundtables')
  const loading = ref(false)

  // Detail page state
  const currentRoundtable = ref(null)
  const currentRoundtableLoading = ref(false)
  let unwatchCurrentRoundtableRef = null

  const roundtables = computed(() => collection.docsArray.value)

  const drafts = computed(() =>
    roundtables.value.filter((rt) => rt.status === 'draft')
  )

  const shared = computed(() =>
    roundtables.value.filter((rt) => rt.status === 'shared')
  )

  const archived = computed(() =>
    roundtables.value.filter((rt) => rt.status === 'archived')
  )

  const active = computed(() =>
    roundtables.value.filter((rt) => rt.status !== 'archived')
  )

  function subscribeToMine() {
    if (!userStore.uid) return
    collection.setPath('roundtables')
    collection.setFilter([['ownerId', '==', userStore.uid]])
    collection.subscribe()
  }

  function unsubscribe() {
    collection.unsubscribe()
  }

  function watchRoundtable(id) {

    if (!id) {
      currentRoundtable.value = null
      currentRoundtableLoading.value = false
      return
    }

    if (unwatchCurrentRoundtableRef) {
      unwatchCurrentRoundtableRef()
      unwatchCurrentRoundtableRef = null
    }

    currentRoundtableLoading.value = true

    const roundtableRef = doc(getDB(), 'roundtables', id)

    unwatchCurrentRoundtableRef = onSnapshot(
      roundtableRef,
      (snap) => {
        // alert(`watchRoundtable exists: ${snap.exists()} | id: ${id}`)

        if (snap.exists()) {
          currentRoundtable.value = {
            id: snap.id,
            ...snap.data(),
          }
        } else {
          currentRoundtable.value = null
        }

        currentRoundtableLoading.value = false
      },
      (err) => {
        console.error('Failed to watch roundtable:', err)
        // alert(`watchRoundtable failed: ${err?.code || 'no-code'} | ${err?.message || 'no-message'}`)
        currentRoundtable.value = null
        currentRoundtableLoading.value = false
      }
    )
  }

  function unwatchRoundtable() {
    if (unwatchCurrentRoundtableRef) {
      unwatchCurrentRoundtableRef()
      unwatchCurrentRoundtableRef = null
    }

    currentRoundtable.value = null
    currentRoundtableLoading.value = false
  }

  async function createRoundtable({ title, question, description = '' }) {
    if (!userStore.uid) throw new Error('User must be logged in')

    loading.value = true
    try {
      const now = new Date().toISOString()

      return await collection.add({
        title: title.trim(),
        question: question.trim(),
        description: description.trim(),
        ownerId: userStore.uid,
        ownerName: userStore.name || userStore.email || 'Unknown user',
        status: 'draft',
        shareCode: null,
        sharedAt: null,
        archivedAt: null,
        participantIds: [userStore.uid],
        createdAt: now,
        updatedAt: now,
      })
    } finally {
      loading.value = false
    }
  }

  async function updateRoundtable(id, payload) {
    const existing = collection.documents.value[id]
    if (!existing) throw new Error('Round table not found')
    if (existing.status !== 'draft') {
      throw new Error('Only draft round tables can be edited')
    }

    loading.value = true
    try {
      return await collection.update(id, {
        ...payload,
        updatedAt: new Date().toISOString(),
      })
    } finally {
      loading.value = false
    }
  }

  async function deleteRoundtable(id) {
    const existing = collection.documents.value[id]
    if (!existing) throw new Error('Round table not found')
    if (existing.status !== 'draft') {
      throw new Error('Only draft round tables can be deleted')
    }

    loading.value = true
    try {
      return await collection.remove(id)
    } finally {
      loading.value = false
    }
  }

  async function shareRoundtable(id) {
    const existing = collection.documents.value[id]
    if (!existing) throw new Error('Round table not found')
    if (existing.status !== 'draft') {
      throw new Error('Only draft round tables can be shared')
    }

    loading.value = true
    try {
      const now = new Date().toISOString()

      return await collection.update(id, {
        status: 'shared',
        shareCode: makeShareCode(),
        sharedAt: now,
        updatedAt: now,
      })
    } finally {
      loading.value = false
    }
  }

  async function archiveRoundtable(id) {
    const existing = collection.documents.value[id]
    if (!existing) throw new Error('Round table not found')
    if (existing.status !== 'shared') {
      throw new Error('Only shared round tables can be archived')
    }

    loading.value = true
    try {
      const now = new Date().toISOString()

      return await collection.update(id, {
        status: 'archived',
        archivedAt: now,
        updatedAt: now,
      })
    } finally {
      loading.value = false
    }
  }

  async function subscribeToRoundtable(id) {
    if (!userStore.uid) throw new Error('User must be logged in')
    if (!id) throw new Error('Round table id is required')

    const existing =
      currentRoundtable.value?.id === id
        ? currentRoundtable.value
        : collection.documents.value[id]
          ? { id, ...collection.documents.value[id] }
          : null

    if (!existing) throw new Error('Round table not found')
    if (existing.status !== 'shared') {
      throw new Error('Only shared round tables can be joined')
    }

    const participantIds = Array.isArray(existing.participantIds)
      ? existing.participantIds
      : []

    if (participantIds.includes(userStore.uid)) return

    loading.value = true
    try {
      const roundtableRef = doc(getDB(), 'roundtables', id)

      await updateDoc(roundtableRef, {
        participantIds: [...participantIds, userStore.uid],
        updatedAt: new Date().toISOString(),
      })
    } finally {
      loading.value = false
    }
  }

  function getById(id) {
    const doc = collection.documents.value[id]
    return doc ? { id, ...doc } : null
  }

  function findLoadedRoundtable(id) {
  return roundtables.value.find(rt => rt.id === id) || null
  }

  return {
    loading,
    error: collection.error,
    roundtables,
    drafts,
    shared,
    archived,
    active,
    currentRoundtable,
    currentRoundtableLoading,
    subscribeToMine,
    unsubscribe,
    watchRoundtable,
    unwatchRoundtable,
    createRoundtable,
    updateRoundtable,
    deleteRoundtable,
    shareRoundtable,
    archiveRoundtable,
    subscribeToRoundtable,
    getById,
    findLoadedRoundtable,
  }
})