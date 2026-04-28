<script setup>
import { useQuestions } from '~/composables/useQuestions'

const props = defineProps({
  roundtableId: { type: String, required: true },
})

const { questions } = useQuestions(`roundtables/${props.roundtableId}`)
</script>

<template>
  <div class="mt-6">
    <div class="d-flex align-center ga-2 mb-4">
      <v-icon color="warning">mdi-podium</v-icon>
      <span class="text-h6">Voting Results</span>
    </div>

    <v-alert v-if="questions.length === 0" type="info" variant="tonal">
      No questions were registered for this RoundTable.
    </v-alert>

    <v-row>
      <v-col
        v-for="q in questions"
        :key="q.id"
        cols="12"
        md="4"
      >
    <ResultsQuestionResult :question="q" />
      </v-col>
    </v-row>
  </div>
</template>