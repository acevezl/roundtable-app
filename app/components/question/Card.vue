<script setup>
import { useOptions } from '~/composables/useOptions'
import { useUserStore } from '~/stores/user'

const emit = defineEmits([
  'editQuestionTitle',
  'removeQuestion',
  'toggleVote',
  'removeOption',
  'setWinningVote',
])

const props = defineProps({
  question: { type: Object, required: true },
  winningVote: { type: String, default: null },
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

const winningOptionTitle = computed(() => {
  if (!props.question.winningVote) return null
  const option = options.value.find(o => o.id === props.question.winningVote)
  return option?.title || props.question.winningVote
})
</script>

<template>
  <v-card class="mb-4 rounded-lg mt-4" variant="outlined">
    <v-card-item>
      <div class="d-flex justify-space-between align-start w-100 ga-3">
        <div class="flex-grow-1">
          <div class="text-overline text-medium-emphasis mb-1">Question</div>

          <EditableTitle
            :title="question.title"
            placeholder="Question title"
            @submit="(t) => emit('editQuestionTitle', t)"
          >
            <h3 class="text-h6 my-0">{{ question.title }}</h3>
          </EditableTitle>
        </div>

        <v-btn
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          aria-label="Delete question"
          @click="emit('removeQuestion')"
        />
      </div>
    </v-card-item>

    <v-divider />

    <v-card-text class="pt-4">
      <div class="text-body-2 text-medium-emphasis mb-2">Add option</div>

      <InlineAdd
        placeholder="Add option"
        @submit="(title) => addOption({ title })"
      />
    <!-- Options -->
      <div
        v-if="options.length === 0"
        class="text-body-2 text-medium-emphasis mt-4"
      >
        No options yet.
      </div>

      <div v-else class="d-flex flex-column ga-3 mt-4">
        <div
          v-for="o in options"
          :key="o.id"
          class="pa-3 rounded-lg bg-grey-lighten-5"
        >
          <div class="d-flex justify-space-between align-center ga-3">
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

            <v-chip size="small" variant="outlined">
              {{ voteCount(o.id) }} votes
            </v-chip>
          </div>
        </div>
      </div>

      <!-- Winning vote -->
      <div class="mt-4 pa-3 rounded-lg bg-green-lighten-5">
        <div class="d-flex justify-space-between align-center">
          <div class="text-body-2">
            <v-icon size="small" start>mdi-trophy</v-icon>
            <span v-if="winningOptionTitle" class="text-medium-emphasis">
              Winning option: <strong>{{ winningOptionTitle }}</strong>
            </span>
            <span v-else class="text-medium-emphasis">
              No winning option set yet
            </span>
          </div>
        </div>
      </div>

      
    </v-card-text>
  </v-card>
</template>