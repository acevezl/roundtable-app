<script setup>
import { ref } from 'vue'
import { useOptions } from '~/composables/useOptions'

const props = defineProps({
  question: { type: Object, required: true },
})

const { options, addOption } = useOptions(props.question.path)

const newTitle = ref('')

function handleAdd() {
  if (!newTitle.value.trim()) return
  addOption({
    title: newTitle.value
  })
  newTitle.value = ''
}

</script>

<template>
  <v-card variant="outlined" class=".question-card">
    <h3>{{ question.title }}</h3>
    <input v-model="newTitle" placeholder="Option title" />
    <button @click="handleAdd">Add Option</button>

    <div class="cards">
      <OptionCard
        v-for="o in options"
        :key="o.id"
        :option="o"
        class="option-card"
      />
    </div>
  
  </v-card>
</template>