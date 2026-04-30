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

const newTitle = ref('')
function handleAdd() {
  addOption({
    title: newTitle.value
  })
  newTitle.value = ''
}
const updatedTitle = ref('')
function handleEditTitle() {
  emit('editQuestionTitle', updatedTitle.value)
  updatedTitle.value = ''
}
const voteCount = computed(() => (optionId) => {
    const votes = props.question.votesByOption || {}
    return (votes[optionId] != null) ? votes[optionId].length : 0
})
</script>

<template>
  <div>
    <h3>{{ question.title }}</h3>
    <input v-model="updatedTitle" placeholder="new question title" />
    <button @click="handleEditTitle">Edit Question title</button>
    <input v-model="newTitle" placeholder="Option title" />
    <button @click="handleAdd">Add Option</button>
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