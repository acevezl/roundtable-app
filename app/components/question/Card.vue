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

const expanded = ref(false)
</script>

<template>
  <v-card class="my-2 rounded-lg" variant="outlined">
    <v-card-item
      :style="expanded ? '' : 'cursor: pointer'"
      @click="()=>{if (!expanded) expanded = true}"
    >
      <div class="d-flex justify-space-between align-start w-100 ga-3">
        <div class="d-flex align-start ga-2 flex-grow-1">
          <v-btn
            :icon="expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
            size="small"
            variant="text"
            :aria-label="expanded ? 'Collapse question' : 'Expand question'"
            @click.stop="expanded = !expanded"
          />

          <div class="flex-grow-1">
            <div class="text-overline text-medium-emphasis mb-1">Question</div>

            <EditableTitle
              v-if="expanded"
              :title="question.title"
              placeholder="Question title"
              @submit="(t) => emit('editQuestionTitle', t)"
            >
              <h3 class="text-h6 my-0">{{ question.title }}</h3>
            </EditableTitle>
            <h3 v-else class="text-h6 my-0">{{ question.title }}</h3>
          </div>
        </div>

        <v-btn
          v-if="expanded"
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          aria-label="Delete question"
          @click.stop="emit('removeQuestion')"
        />
      </div>
    </v-card-item>

    <v-expand-transition>
      <div v-if="expanded">
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
      </div>
    </v-expand-transition>
  </v-card>
</template>