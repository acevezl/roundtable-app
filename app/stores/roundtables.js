// RoundTable Domain

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, limit, query, setDoc, where, onSnapshot, updateDoc } from 'firebase/firestore'
import { getDB } from '~/services/fireinit'
import { useUserStore } from '~/stores/user'
import { useFirestoreCollection } from '~/composables/useFirestoreCollection'

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
      (e) => {
        // console.error('Failed to watch roundtable:', e)
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

  async function closeVoting(id) {
    const existing = findLoadedRoundtable(id)
    if (!existing) throw new Error('Round table not found')

    loading.value = true
    try {
      const now = new Date().toISOString()

      await ownedCollection.update(id, {
        status: 'closed',
        updatedAt: now,
      })
    } finally {
      loading.value = false
    }
  }

  async function createRoundtable({ title, decision }) {
    if (!userStore.uid) throw new Error('User must be logged in')

    loading.value = true
    try {
      const now = new Date().toISOString()

      return await ownedCollection.add({
        title: title.trim(),
        decision: decision.trim(),
        ownerId: userStore.uid,
        ownerName: userStore.name || userStore.email || 'Unknown user',
        participantIds: [userStore.uid],
        status: 'open',
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

  // Share RoundTable
  // Creates a new roundtableInvite if none exists, or if it is expired
  async function shareRoundtable(rt) {
    if (!rt.id) return

    loading.value = true

    try {
      const existingInvite = await getActiveInviteForRoundTable(rt.id)

      let shareCode = null

      if (existingInvite) {
        const isActive = existingInvite.status === 'active'
        const notExpired = new Date(existingInvite.expiresAt) > new Date()

        if (isActive && notExpired) {
          shareCode = existingInvite.id
        } else {
          await deleteDoc(
            doc(getDB(),
            'roundtableInvites',
            existingInvite.id
          ))
        }
      }

      if (!shareCode) {
        shareCode = await createInviteForRoundTable(rt)
      }

      const url = `${window.location.origin}/join/${shareCode}`

      if (navigator.share){
        await navigator.share({url})
      } else {
        await navigator.clipboard.writeText(url)
        alert('Round table link copied to clipboard')
      }

    } catch (e) {
      console.error('Error sharing round table:', e)
    } finally {
      loading.value = false
    }
  }

  // Creates an alphanumeric share code
  function makeShareCode(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let out = ''
    for (let i = 0; i < length; i++) {
      out += chars[Math.floor(Math.random() * chars.length)]
    }
    return out
  }

  function addHours(date, hours) {
    return new Date(date.getTime() + hours * 60 * 60 * 1000)
  }

  // Retrieves the active RT invite
  async function getActiveInviteForRoundTable(roundtableId) {
    
    const q = query (
      collection(getDB(), 'roundtableInvites'),
      where('roundtableId','==', roundtableId),
      limit(1)
    )

    const snap = await getDocs(q)
    if (snap.empty) return null

    const inviteSnap = snap.docs[0]
    const data = inviteSnap.data()

    return {
      id: inviteSnap.id,
      ...data,
    }
  }

  async function createInviteForRoundTable(rt) {
    const now = new Date()
    const expiresAt = addHours(now, 24) 
    const shareCode = makeShareCode(10)

    await setDoc(doc(getDB(), 'roundtableInvites', shareCode),
      {
        roundtableId: rt.id,
        ownerId: rt.ownerId,
        title: rt.title,
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      }
    )

    return shareCode
  }

  async function subscribeToRoundtable(id) {
    if (!userStore.uid) throw new Error('User must be logged in')
    if (!id) throw new Error('Round table id is required')

    loading.value = true
    try {
      const roundtableRef = doc(getDB(), 'roundtables', id)

      await updateDoc(roundtableRef, {
        participantIds: arrayUnion(userStore.uid),
        updatedAt: new Date().toISOString(),
      })
    } finally {
      loading.value = false
    }
  }

  async function unsubscribeFromRoundtable(id) {
    if (!userStore.uid) throw new Error('User must be logged in')
    if (!id) throw new Error('Round table id is required')

    loading.value = true
    try {
      const roundtableRef = doc(getDB(), 'roundtables', id)

      await updateDoc(roundtableRef, {
        participantIds: arrayRemove(userStore.uid),
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
    unsubscribeFromRoundtable,
    getById,
    findLoadedRoundtable,
    closeVoting,
  }
})