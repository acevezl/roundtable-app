import { useUserStore } from '@/stores/user'

export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore()
  const loginPage = '/login'

  await userStore.initAuth()

  if (!userStore.logged) {
    userStore.setAfterLogin(to.path)
    return navigateTo(loginPage)
  }
})