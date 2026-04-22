<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoundtablesStore } from '~/stores/roundtables'
import { useUserStore } from '~/stores/user'

definePageMeta({
  middleware: ['authenticated']
})

const router = useRouter()
const userStore = useUserStore()
const roundtablesStore = useRoundtablesStore()

const formRef = ref(null)
const valid = ref(false)
const saving = ref(false)
const submitError = ref('')

const form = ref({
  title: '',
  decision: '',
  description: '',
})

const titleRules = [
  (v) => !!v?.trim() || 'Title is required',
  (v) => v.trim().length >= 4 || 'Title must be at least 4 characters',
]

const decisionRules = [
  (v) => !!v?.trim() || 'Decision is required',
  (v) => v.trim().length >= 10 || 'Decision must be at least 10 characters',
]

const descriptionRules = [
  (v) => !v || v.length <= 500 || 'Description must be 500 characters or less',
]

const canSubmit = computed(() => {
  return !saving.value && valid.value
})

async function submitForm() {
  submitError.value = ''

  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  saving.value = true

  try {
    const docId = await roundtablesStore.createRoundtable({
      title: form.value.title,
      decision: form.value.decision,
      description: form.value.description,
    })

    router.push(`/roundtables/${docId}`)
  } catch (error) {
    submitError.value = error?.message || 'Could not create round table'
  } finally {
    saving.value = false
  }
}

function resetForm() {
  form.value = {
    title: '',
    decision: '',
    description: '',
  }
  submitError.value = ''
  formRef.value?.resetValidation()
}
</script>

<template>
  <v-container class="py-6">
    <div class="mb-6">
      <h1 class="text-h4 mb-2">Create Round Table</h1>
      <p class="text-medium-emphasis">
        Start a new decision round table and share it with others.
      </p>
    </div>

    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card>
          <v-card-text class="pa-6">
            <v-alert
              v-if="submitError"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ submitError }}
            </v-alert>

            <v-form
              ref="formRef"
              v-model="valid"
              @submit.prevent="submitForm"
            >
              <v-text-field
                v-model="form.title"
                label="Title"
                placeholder="Friday team dinner"
                :rules="titleRules"
                variant="outlined"
                class="mb-4"
                required
              />

              <v-textarea
                v-model="form.decision"
                label="Decision"
                placeholder="Where should we go for dinner this Friday?"
                :rules="decisionRules"
                variant="outlined"
                rows="3"
                auto-grow
                class="mb-4"
                required
              />

              <v-textarea
                v-model="form.description"
                label="Context or description (optional)"
                placeholder="Add context, constraints, or extra details"
                :rules="descriptionRules"
                variant="outlined"
                rows="4"
                auto-grow
                counter="500"
                class="mb-6"
              />

              <div class="d-flex flex-wrap ga-3">
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="saving"
                  :disabled="!canSubmit"
                >
                  Create Round Table
                </v-btn>

                <v-btn
                  variant="text"
                  :disabled="saving"
                  @click="resetForm"
                >
                  Reset
                </v-btn>

                <v-btn
                  variant="text"
                  :disabled="saving"
                  @click="$router.push('/roundtables')"
                >
                  Cancel
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>