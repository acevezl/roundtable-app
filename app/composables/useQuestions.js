import { getAuth } from 'firebase/auth'
import { serverTimestamp } from 'firebase/firestore'
import { useFirestoreCollection } from '~/composables/useFirestoreCollection'
import { ref, computed, onUnmounted } from 'vue'

export function useQuestions(roundtablePath) {
  const questionsCollection = useFirestoreCollection(`${roundtablePath}/questions`)

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
      const auth = getAuth()
      const uid = auth.currentUser?.uid
      await questionsCollection.add({
        title,
        ownerId: uid,
        votes: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Failed to add question:', err)
      error.value = err
    }
  }
  async function removeQuestion(questionId) {
    try {
      await questionsCollection.remove(questionId)
    } catch (err) {
      console.error('Failed to remove question:', err)
      error.value = err
    }
  }

  return {
    questions,
    error,
    addQuestion,
    removeQuestion,
    path: questionsCollection.path
  }
}