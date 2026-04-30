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
    <v-btn
      icon="mdi-delete"
      size="small"
      variant="tonal"
      density="comfortable"
      aria-label="Delete option"
      @click="emit('removeOption')"
    />
  </div>
</template>
