<script setup>
import { useOptions } from '~/composables/useOptions'

const emit = defineEmits([
  'editQuestionTitle',
  'removeQuestion',
  'toggleVote',
  'removeOption',
])

const props = defineProps({
  question: { type: Object, required: true },
})

const { 
  options, 
  addOption, 
  removeOption,
  editOption,
  deleteVotes,
} = useOptions(props.question.path)

const voteCount = computed(() => (optionId) => {
    const votes = props.question.votesByOption || {}
    return (votes[optionId] != null) ? votes[optionId].length : 0
})
</script>

<template>
  <div>
    <EditableTitle
      :title="question.title"
      placeholder="Question title"
      @submit="(t) => emit('editQuestionTitle', t)"
    >
      <h3>{{ question.title }}</h3>
    </EditableTitle>
    Add option: <InlineAdd
      placeholder="Add option"
      @submit="(title) => addOption({ title })"
    />
    <button @click="emit('removeQuestion')">Remove Question</button>
    <ul>
      <li v-for="o in options" :key="o.id">
        <OptionCard :option="o"
          @editOption="(title) => editOption(o.id, title)"
          @removeOption="() => { removeOption(o.id); emit('removeOption', o.id) }"/>
        Number of votes: {{voteCount(o.id)}}
        <button @click="emit('toggleVote', o.id)">Toggle vote</button>
      </li>
    </ul>
  </div>
</template>