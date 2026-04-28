import { getAuth } from 'firebase/auth'
import { serverTimestamp } from 'firebase/firestore'
import { useFirestoreCollection } from '~/composables/useFirestoreCollection'
import { ref, computed, onUnmounted } from 'vue'

export function useQuestions(roundtablePath) {
  const error = ref(null)
  const questionsCollection = useFirestoreCollection(`${roundtablePath}/questions`)
  const questions = computed(() => {
    return questionsCollection.docsArray.value || []
  })

  onUnmounted(() => {
    questionsCollection.unsubscribe()
  })

  onMounted(() => {
    questionsCollection.subscribe()
  })

  const questionsAPI = {
    addQuestion: async ({ title }) => {
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
    },
    removeQuestion: async (questionId) => {
      try {
        await questionsCollection.remove(questionId)
      } catch (err) {
        console.error('Failed to remove question:', err)
        error.value = err
      }
    },
    editQuestionTitle: async (questionId, title) => {
      try {
        await questionsCollection.update(questionId, { title })
      } catch (err) {
        console.error('Failed to edit question title:', err)
        error.value = err
      }
    },
  }

  return {
    questions,
    error,
    ...questionsAPI,
    path: questionsCollection.path
  }
}