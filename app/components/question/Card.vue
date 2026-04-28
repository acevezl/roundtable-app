<script setup>
import { useOptions } from '~/composables/useOptions'

const props = defineProps({
  question: { type: Object, required: true },
})

const { options, addOption, removeOption } = useOptions(props.question.path)

const newTitle = ref('')
function handleAdd() {
  addOption({
    title: newTitle.value
  })
  newTitle.value = ''
}


</script>

<template>
  <div>
    <h3>{{ question.title }}</h3>
    <input v-model="newTitle" placeholder="Option title" />
    <button @click="handleAdd">Add Option</button>
    <ul>
      <li v-for="o in options" :key="o.id">
        <OptionCard :option="o" />
        <button @click="removeOption(o.id)">Remove Option</button>
      </li>
    </ul>
  </div>
</template>