<script setup>
import { computed } from 'vue'
import { useOptions } from '~/composables/useOptions'

const props = defineProps({
  questions: { type: Array, required: true },
})
</script>

<template>
  <v-card variant="tonal" color="primary" class="mb-6">
    <v-card-item>
      <template #prepend>
        <v-icon color="warning" size="large">mdi-trophy</v-icon>
      </template>
      <v-card-title>Final Decision</v-card-title>
    </v-card-item>

    <v-card-text>
      <ResultsFinalDecisionRow
        v-for="q in questions"
        :key="q.id"
        :question="q"
      />
    </v-card-text>
  </v-card>
</template>