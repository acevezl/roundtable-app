<script setup>
import { computed } from 'vue'
import { useOptions } from '~/composables/useOptions'

const props = defineProps({
  question: { type: Object, required: true },
})

const { options } = useOptions(props.question.path)

const winner = computed(() =>
  options.value.find((o) => o.id === props.question.winningVote) || null
)
</script>

<template>
  <div class="d-flex align-center ga-4 py-2">
    <span class="text-body-2 text-medium-emphasis" style="min-width: 200px">
      {{ question.title }}
    </span>
    <v-icon size="small">mdi-arrow-right</v-icon>
    <span class="font-weight-bold">
      {{ winner ? winner.title : 'No winner yet' }}
    </span>
  </div>
</template>