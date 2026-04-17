import { useUserStore } from '@/stores/user'

export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore()

  await userStore.initAuth()

  if (!userStore.logged) {
    const redirectTarget = to.fullPath

    userStore.setAfterLogin(redirectTarget)

    return navigateTo({
      path: '/login',
      query: {
        redirect: redirectTarget
      }
    })
  }
})