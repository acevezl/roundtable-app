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
          winningVote: null
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
    },
    deleteVotes: async (questionId, optionId) => {
      const votesByOption = questionsCollection.documents.value[questionId].votesByOption || {}
      delete votesByOption[optionId]
      try {
        await questionsCollection.update(questionId, {
          votesByOption
        })
      } catch (err) {
        console.error('Failed to remove vote:', err)
        error.value = err
      }
    },
    setWinningOption: async (questionId, tiebreak, optionArray = []) => {
      if (!tiebreak)
        tiebreak = 'none'
      //tiebreak: priority, random, none
      const votesByOption = questionsCollection.documents.value[questionId].votesByOption || {}
      let highestVote = 0;
      const winningOptions = [];
      for (const optionId in votesByOption) {
        if (votesByOption[optionId].length > highestVote)
          highestVote = votesByOption[optionId].length
      }
      if (highestVote > 0) {
        for (const optionId in votesByOption) {
          if (votesByOption[optionId].length == highestVote)
            winningOptions.push(optionId)
        }
      }
      let foundOption
      if (winningOptions.length == 0) {
        console.log("no votes")
        foundOption = ""
      } else if (winningOptions.length == 1 || tiebreak == 'none') {
        console.log("one winning vote found")
        foundOption = winningOptions[0]
      } else if (tiebreak == 'random') {
        console.log("multiple winning votes found; choosing at random")
        function hash(seed, max) {
          let h = 0;
          for (let i = 0; i < seed.length; i++) {
            h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
          }
          return (h >>> 0) % (max);
        }
        const chosen = hash(questionId, winningOptions.length)
        foundOption = winningOptions[chosen]
      } else if (tiebreak == 'priority') {
        console.log("multiple winning votes found; choosing by prio")
        foundOption = optionArray.find(item => winningOptions.includes(item)) || ""
      }
      if (foundOption == "") {
        console.warn("No winning vote found for question " + questionId)
      }
      try {
        await questionsCollection.update(questionId, {
          winningVote: foundOption
        })
      } catch (err) {
        console.error('Failed to set winning option:', err)
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