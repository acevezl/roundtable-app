// RoundTable Domain

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { getDB } from '~/services/fireinit'
import { useUserStore } from '~/stores/user'
import { useFirestoreCollection } from '~/composables/useFirestoreCollection'

function makeShareCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export const useRoundtablesStore = defineStore('roundtables', () => {
  const userStore = useUserStore()

  const ownedCollection = useFirestoreCollection('roundtables')
  const joinedCollection = useFirestoreCollection('roundtables')

  const loading = ref(false)

  const currentRoundtable = ref(null)
  const currentRoundtableLoading = ref(false)
  let unwatchCurrentRoundtableRef = null

  const error = computed(() =>
    ownedCollection.error.value || joinedCollection.error.value || ''
  )

  const roundtables = computed(() => {
    const merged = [
      ...(ownedCollection.docsArray.value || []),
      ...(joinedCollection.docsArray.value || []),
    ]

    const map = new Map()
    for (const rt of merged) {
      map.set(rt.id, rt)
    }

    return Array.from(map.values())
  })

  function subscribeToMine() {
    if (!userStore.uid) return

    ownedCollection.setPath('roundtables')
    ownedCollection.setFilter([['ownerId', '==', userStore.uid]])
    ownedCollection.subscribe()

    joinedCollection.setPath('roundtables')
    joinedCollection.setFilter([['participantIds', 'array-contains', userStore.uid]])
    joinedCollection.subscribe()
  }

  function unsubscribe() {
    ownedCollection.unsubscribe()
    joinedCollection.unsubscribe()
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

      return await ownedCollection.add({
        title: title.trim(),
        question: question.trim(),
        description: description.trim(),
        ownerId: userStore.uid,
        ownerName: userStore.name || userStore.email || 'Unknown user',
        shareCode: makeShareCode(10),
        participantIds: [userStore.uid],
        status: 'Open',
        createdAt: now,
        updatedAt: now,
      })
    } finally {
      loading.value = false
    }
  }

  async function updateRoundtable(id, payload) {
    const existing = findLoadedRoundtable(id)
    if (!existing) throw new Error('Round table not found')

    loading.value = true
    try {
      await ownedCollection.update(id, {
        ...payload,
        updatedAt: new Date().toISOString(),
      })
    } finally {
      loading.value = false
    }
  }

  async function deleteRoundtable(id) {
    const existing = findLoadedRoundtable(id)
    if (!existing) throw new Error('Round table not found')

    loading.value = true
    try {
      await ownedCollection.remove(id)
    } finally {
      loading.value = false
    }
  }

  async function shareRoundtable(id) {
    const existing = findLoadedRoundtable(id)
    if (!existing) throw new Error('Round table not found')

    loading.value = true
    try {
      const now = new Date().toISOString()

      await ownedCollection.update(id, {
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
        : findLoadedRoundtable(id)

    if (!existing) throw new Error('Round table not found')

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
    return findLoadedRoundtable(id)
  }

  function findLoadedRoundtable(id) {
    return roundtables.value.find((rt) => rt.id === id) || null
  }

  return {
    loading,
    error,
    roundtables,
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
    subscribeToRoundtable,
    getById,
    findLoadedRoundtable,
  }
})