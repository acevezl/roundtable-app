<template>
    <ClientOnly>
        <a-login
            ref="loginRef"
            :error="userStore.error"
            @sign-in="userStore.signUserIn"
            @sign-up="userStore.signUserUp"
        />
    </ClientOnly>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { logged } = storeToRefs(userStore)

const loginRef = useTemplateRef('loginRef')

// The watch will be triggered when the component is available
watch(
    loginRef,
    () => {
        userStore.initAuth()
    },
    { once: true }
)

watch(
    logged,
    (logged) => {
        if (logged) {
            const newPath = userStore.afterLogin
            userStore.setAfterLogin('/')
            navigateTo(newPath)
        }
    },
    { immediate: true }
)
</script>

<style scoped></style>
