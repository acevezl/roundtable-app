import { serverTimestamp } from 'firebase/firestore'
import { useFirestoreCollection } from '~/composables/useFirestoreCollection'
import { ref, computed, onUnmounted } from 'vue'

export function useOptions(roundtableId, questionId) {
  const optionsCollection = useFirestoreCollection(`roundtables/${roundtableId}/questions/${questionId}/options`)

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
    try {
      await optionsCollection.add({
        title,
      })
    } catch (err) {
      console.error('Failed to add option:', err)
      error.value = err
    }
  }

  return {
    options,
    error,
    addOption
  }
}
