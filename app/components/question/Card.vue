<script setup>
import { useOptions } from '~/composables/useOptions'

const emit = defineEmits(['editQuestionTitle', 'removeQuestion'])

const props = defineProps({
  question: { type: Object, required: true },
})

const { 
  options, 
  addOption, 
  removeOption, 
  editOption 
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
          @removeOption="removeOption(o.id)"/>
      </li>
    </ul>
  </div>
</template>