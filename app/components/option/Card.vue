<script setup>
defineProps({
  option: { type: Object, required: true },
})
const emit = defineEmits(['editOption', 'removeOption'])
const newTitle = ref('')

function handleEdit() {
  emit('editOption', newTitle.value)
  newTitle.value = ''
}

</script>

<template>
  <div>
    {{ option.title }}
    <input v-model="newTitle" placeholder="New title" />
    <button @click="handleEdit">Edit option</button>
    <button @click="emit('removeOption')">Remove Option</button>
  </div>
</template>