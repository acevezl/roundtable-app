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
        if (!title)
          throw new Error("titles cannot be empty")
        const auth = getAuth()
        const uid = auth.currentUser?.uid
        await questionsCollection.add({
          title,
          ownerId: uid,
          votesByOption: {},
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
        if (!title)
          throw new Error("titles cannot be empty")
        await questionsCollection.update(questionId, {
          title,
          updatedAt: serverTimestamp()
        })
      } catch (err) {
        console.error('Failed to edit question title:', err)
        error.value = err
      }
    },
    toggleVoteForOption: async (questionId, optionId) => {
      const auth = getAuth()
      const uid = auth.currentUser?.uid
      const votes = questionsCollection.documents.value[questionId].votesByOption || {}
      if (!votes[optionId])
        votes[optionId] = []
      if (!votes[optionId].includes(uid))
        votes[optionId].push(uid)
      else
        votes[optionId] = votes[optionId].filter(id => id !== uid)
      try {
        await questionsCollection.update(questionId, {
          votesByOption: votes,
          updatedAt: serverTimestamp()
        })
      } catch (err) {
        console.error('Failed to toggle vote:', err)
        error.value = err
      }
    }
  }

  return {
    questions,
    error,
    ...questionsAPI,
    path: questionsCollection.path
  }
}