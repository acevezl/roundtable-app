<script setup>
import { ref, nextTick } from 'vue'

defineProps({
    placeholder: { type: String, default: 'Add' },
})

const emit = defineEmits(['submit'])

const expanded = ref(false)
const text = ref('')
const fieldRef = ref(null)

async function expand() {
    expanded.value = true
    await nextTick()
    fieldRef.value?.focus?.()
}

function collapse() {
    expanded.value = false
    text.value = ''
}

function handleSubmit() {
    const value = text.value.trim()
    if (value) {
        emit('submit', value)
    }
    collapse()
}
</script>

<template>
    <div class="inline-add">
        <v-btn
            v-if="!expanded"
            icon="mdi-plus"
            size="small"
            variant="tonal"
            density="comfortable"
            :aria-label="placeholder"
            @click="expand"
        />

        <v-text-field
            v-else
            ref="fieldRef"
            v-model="text"
            :placeholder="placeholder"
            :aria-label="placeholder"
            density="compact"
            variant="outlined"
            hide-details
            autofocus
            @keydown.enter.prevent="handleSubmit"
            @keydown.esc.prevent="collapse"
            @blur="collapse"
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
