import { getAuth } from 'firebase/auth'
import { serverTimestamp } from 'firebase/firestore'
import { useFirestoreCollection } from '~/composables/useFirestoreCollection'
import { ref, computed, onUnmounted } from 'vue'

export function useOptions(questionPath) {
  const optionsCollection = useFirestoreCollection(`${questionPath}/options`)

  const options = computed(() => {
    return optionsCollection.docsArray.value || []
  })
  const error = ref(null)

  onUnmounted(() => {
    optionsCollection.unsubscribe()
  })

  onMounted(() => {
    optionsCollection.subscribe()
  })

  // add a new option
  async function addOption({ title }) {
    const auth = getAuth()
    const uid = auth.currentUser?.uid
    try {
      await optionsCollection.add({
        title,
        ownerId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Failed to add option:', err)
      error.value = err
    }
  }

  async function removeOption(optionId) {
    try {
      await optionsCollection.remove(optionId)
    } catch (err) {
      console.error('Failed to remove option:', err)
      error.value = err
    }
  }

  async function editOption(optionId, title) {
    try {
      await optionsCollection.update(optionId, {
        title,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Failed to edit option:', err)
      error.value = err
    }
  }

  return {
    options,
    error,
    addOption,
    removeOption,
    editOption,
    path: optionsCollection.path
  }
}
