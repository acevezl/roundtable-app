<script setup>
import { computed, ref } from 'vue'
import { useUserStore } from '~/stores/user'
import { useNuxtApp } from '#app'

const userStore = useUserStore()

const formRef = ref(null)
const valid = ref(false)
const loading = ref(false)

const form = ref({
  email: '',
  password: '',
})

const emailRules = [
  (v) => !!v?.trim() || 'E-mail is required',
  (v) => /.+@.+\..+/.test(v) || 'Enter a valid e-mail',
]

const passwordRules = [
  (v) => !!v || 'Password is required',
]

const canSubmit = computed(() => !loading.value)

await userStore.initAuth()

if (userStore.logged) {
  const target = userStore.afterLogin || '/roundtables'
  userStore.setAfterLogin('/')
  await navigateTo(target)
}

async function submitSignInForm() {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  loading.value = true
  userStore.clearError()

  try {
    await userStore.signUserIn({
      email: form.value.email.trim(),
      password: form.value.password,
    })

    if (userStore.logged) {
      userStore.setAfterLogin('/')
      await navigateTo('/roundtables')
    }
  } finally {
    loading.value = false
  }
}

async function submitSignUp() {
	const { valid: isValid } = await formRef.value.validate()
	if (!isValid) return

	loading.value = true
	userStore.clearError()

	try {
		await userStore.signUserUp({
			email: form.value.email.trim(),
			password: form.value.password,
		})

		if (userStore.logged) {
			await sendWelcomeEmail(userStore.email)

			await navigateTo('/roundtables')
		}
	} finally {
		loading.value = false
	}
}

async function sendWelcomeEmail(email) {
	const { $firestore } = useNuxtApp()

	await $firestore.collection('mail').add({
		to: [email],
		message: {
			subject: 'Welcome to RoundTable',
			html: `<p>Welcome to RoundTable.</p>`
		}
	})
}
</script>

<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" sm="10" md="6" lg="4">
        <v-card>
          <v-card-title class="text-h5">Log in</v-card-title>

          <v-card-text>
            <p class="mb-4 text-medium-emphasis">
              Sign in to create and manage round tables.
            </p>
            <p class="mb-4 text-medium-emphasis">
              <b>New user?</b> Just enter your email and password below, and smash the sign up button!
            </p>

            <v-alert
              v-if="userStore.error"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ userStore.error }}
            </v-alert>

            <v-form
              ref="formRef"
              v-model="valid"
              @submit.prevent="submitSignInForm"
            >
                <v-text-field
                    v-model="form.email"
                    label="E-mail"
                    type="email"
                    autocomplete="email"
                    :rules="emailRules"
                    variant="outlined"
                    class="mb-3"
                />

                <v-text-field
                    v-model="form.password"
                    label="Password"
                    type="password"
                    autocomplete="current-password"
                    :rules="passwordRules"
                    variant="outlined"
                    class="mb-4"
                />

                <v-btn
                    type="submit"
                    color="primary"
                    block
                    :loading="loading"
                    :disabled="!canSubmit"
                >
                    Sign in
                </v-btn>
                <v-btn
                    variant="text"
                    block
                    class="mt-2"
                    :disabled="loading"
                    @click="submitSignUp"
                    >
                    Sign up
                </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>