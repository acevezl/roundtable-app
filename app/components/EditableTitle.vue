<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
    title: { type: String, required: true },
    placeholder: { type: String, default: '' },
})

const emit = defineEmits(['submit'])

const editing = ref(false)
const text = ref('')
const fieldRef = ref(null)

async function startEdit() {
    text.value = props.title
    editing.value = true
    await nextTick()
    fieldRef.value?.focus?.()
}

function cancel() {
    editing.value = false
    text.value = ''
}

function handleSubmit() {
    const value = text.value.trim()
    if (value && value !== props.title) {
        emit('submit', value)
    }
    cancel()
}
</script>

<template>
    <div class="editable-title d-flex align-center ga-2">
        <template v-if="!editing">
            <slot />
            <v-btn
                icon="mdi-pencil"
                size="x-small"
                variant="text"
                density="comfortable"
                aria-label="Edit title"
                @click="startEdit"
            />
        </template>

        <v-text-field
            v-else
            ref="fieldRef"
            v-model="text"
            :placeholder="placeholder"
            :aria-label="placeholder || 'Edit title'"
            density="compact"
            variant="outlined"
            hide-details
            autofocus
            @keydown.enter.prevent="handleSubmit"
            @keydown.esc.prevent="cancel"
            @blur="cancel"
        >
            <template #append-inner>
                <v-icon
                    icon="mdi-check"
                    style="cursor: pointer"
                    @mousedown.prevent
                    @click="handleSubmit"
                />
            </template>
        </v-text-field>
    </div>
</template>
