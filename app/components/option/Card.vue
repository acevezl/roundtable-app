<script setup>
defineProps({
  option: { type: Object, required: true },
})
const emit = defineEmits(['editOption', 'removeOption'])
</script>

<template>
  <div>
    <EditableTitle
      :title="option.title"
      placeholder="Option title"
      @submit="(t) => emit('editOption', t)"
    >
      <span>{{ option.title }}</span>
    </EditableTitle>
    <button @click="emit('removeOption')">Remove Option</button>
  </div>
</template>
