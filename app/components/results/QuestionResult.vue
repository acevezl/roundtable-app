<script setup>
import { computed } from 'vue'
import { useOptions } from '~/composables/useOptions'

const props = defineProps({
  question: { type: Object, required: true },
})

const { options } = useOptions(props.question.path)

const totalVotes = computed(() =>
  options.value.reduce((sum, o) => sum + (o.voterIds?.length ?? 0), 0)
)

const rankedOptions = computed(() =>
  [...options.value]
    .map((o) => ({
      ...o,
      votes: o.voterIds?.length ?? 0,
      percentage:
        totalVotes.value > 0
          ? Math.round(((o.voterIds?.length ?? 0) / totalVotes.value) * 100)
          : 0,
    }))
    .sort((a, b) => b.votes - a.votes)
)
</script>

<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-item>
      <v-card-title class="text-body-1 font-weight-semibold">
        {{ question.title }}
      </v-card-title>
      <template #append>
        <v-chip size="small" variant="tonal">
          {{ totalVotes }} {{ totalVotes === 1 ? 'vote' : 'votes' }}
        </v-chip>
      </template>
    </v-card-item>

    <v-card-text class="pt-0">
      <div
        v-if="rankedOptions.length === 0"
        class="text-medium-emphasis text-body-2"
      >
        No options registered.
      </div>

      <div
        v-for="option in rankedOptions"
        :key="option.id"
        class="mb-3"
      >
        <div class="d-flex justify-space-between align-center mb-1">
          <span>{{ option.title }}</span>
          <span class="text-body-2 text-medium-emphasis">
            {{ option.votes }} ({{ option.percentage }}%)
          </span>
        </div>

        <v-progress-linear
          :model-value="option.percentage"
          color="primary"
          rounded
          height="8"
          bg-color="surface-variant"
        />
      </div>
    </v-card-text>
  </v-card>
</template>