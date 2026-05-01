<script setup>
defineProps({
  option: { type: Object, required: true },
  voted: { type: Boolean, default: false },
})
const emit = defineEmits(['editOption', 'removeOption', 'toggleVote'])
</script>

<template>
  <div class="d-flex align-center ga-2">
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
    <v-btn
      :icon="voted ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
      :color="voted ? 'success' : undefined"
      size="small"
      variant="tonal"
      density="comfortable"
      aria-label="Toggle vote"
      @click="emit('toggleVote')"
    />
  </div>
</template>
