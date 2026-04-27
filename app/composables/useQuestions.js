import { serverTimestamp } from 'firebase/firestore'
import { useFirestoreCollection } from '~/composables/useFirestoreCollection'
import { ref, computed, onUnmounted } from 'vue'

export function useQuestions(roundtableId) {
  const questionsCollection = useFirestoreCollection(`roundtables/${roundtableId}/questions`)

  const questions = computed(() => {
    return questionsCollection.docsArray.value || []
  })
  const error = ref(null)

  onUnmounted(() => {
    questionsCollection.unsubscribe()
  })

  onMounted(() => {
    questionsCollection.subscribe()
  })

  // add a new question
  async function addQuestion({ title }) {
    try {
      await questionsCollection.add({
        title,
      })
    } catch (err) {
      console.error('Failed to add question:', err)
      error.value = err
    }
  }

  return {
    questions,
    error,
    addQuestion
  }
}