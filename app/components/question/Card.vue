<script setup>
import { useOptions } from '~/composables/useOptions'
import { useUserStore } from '~/stores/user'

const emit = defineEmits([
  'editQuestionTitle',
  'removeQuestion',
  'toggleVote',
  'removeOption',
])

const props = defineProps({
  question: { type: Object, required: true },
})

const userStore = useUserStore()

const { options, addOption, removeOption, editOption, deleteVotes } =
  useOptions(props.question.path)

const voteCount = computed(() => (optionId) => {
  const votes = props.question.votesByOption || {}
  return votes[optionId] != null ? votes[optionId].length : 0
})

const hasVoted = (optionId) => {
  const voters = props.question.votesByOption?.[optionId]
  return Array.isArray(voters) && voters.includes(userStore.uid)
}
</script>

<template>
  <v-card class="mb-3" variant="outlined">
    <v-card-text class="pa-1">
      <EditableTitle
        :title="question.title"
        placeholder="Question title"
        @submit="(t) => emit('editQuestionTitle', t)"
      >
        <h3 class="my-1">{{ question.title }}</h3>
      </EditableTitle>
      Add option:
      <InlineAdd
        placeholder="Add option"
        @submit="(title) => addOption({ title })"
      />
      <v-btn
        icon="mdi-delete"
        size="small"
        variant="tonal"
        density="comfortable"
        aria-label="Delete question"
        style="vertical-align: middle"
        @click="emit('removeQuestion')"
      />
      <ul class="pl-4">
        <li v-for="o in options" :key="o.id">
          <OptionCard
            :option="o"
            :voted="hasVoted(o.id)"
            @editOption="(title) => editOption(o.id, title)"
            @toggleVote="emit('toggleVote', o.id)"
            @removeOption="
              () => {
                removeOption(o.id)
                emit('removeOption', o.id)
              }
            "
          />
          Number of votes: {{ voteCount(o.id) }}
        </li>
      </ul>
    </v-card-text>
  </v-card>
</template>
