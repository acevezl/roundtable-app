// RoundTable Domain

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '~/stores/user'
import { useFirestoreCollection } from '~/composables/useFirestoreCollection'

function makeShareCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed letters / numbers that could be confused depending on font: IO10
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }

  // Future feature: Make sure each code is unique, but for the class this is fine.

  return out
}

export const useRoundtablesStore = defineStore('roundtables', () => {
  const userStore = useUserStore()

  const collection = useFirestoreCollection('roundtables')
  const loading = ref(false)

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

  function getById(id) {
    const doc = collection.documents.value[id]
    return doc ? { id, ...doc } : null
  }

  return {
    loading,
    error: collection.error,
    roundtables,
    drafts,
    shared,
    archived,
    active,
    subscribeToMine,
    unsubscribe,
    createRoundtable,
    updateRoundtable,
    deleteRoundtable,
    shareRoundtable,
    archiveRoundtable,
    getById,
  }
})