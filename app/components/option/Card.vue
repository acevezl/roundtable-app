<script setup>
import { useUserStore } from '~/stores/user'

const props = defineProps({
  option: { type: Object, required: true },
  voted: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['editOption', 'removeOption', 'toggleVote'])

const userStore = useUserStore()
const isOwner = computed(() => props.option.ownerId === userStore.uid)
</script>

<template>
  <div class="d-flex align-center ga-2">
    <EditableTitle
      :title="option.title"
      placeholder="Option title"
      :readonly="disabled || !isOwner"
      @submit="(t) => emit('editOption', t)"
    >
      <span>{{ option.title }}</span>
    </EditableTitle>
    <v-btn
      v-if="!disabled && isOwner"
      icon="mdi-delete"
      size="small"
      variant="tonal"
      density="comfortable"
      aria-label="Delete option"
      :readonly="disabled || !isOwner"
      @click="emit('removeOption')"
    />
    <v-btn
      :icon="voted ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
      :color="voted ? 'success' : undefined"
      :disabled="disabled"
      size="small"
      variant="tonal"
      density="comfortable"
      aria-label="Toggle vote"
      @click="emit('toggleVote')"
    />
  </div>
</template>
