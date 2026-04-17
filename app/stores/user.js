import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createUser,
  emailReset,
  emailVerification,
  logIn,
  logOut,
  setAuthCallback,
} from '~/services/fireinit'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const authReady = ref(false)
  const authStarted = ref(false)
  const authPromise = ref(null)

  const afterLogin = ref('/')
  const error = ref('')

  const errorMessages = {
    'invalid-email': 'Invalid e-mail',
    'user-disabled': 'User account is disabled',
    'user-not-found': 'User not found, try to sign up instead',
    'wrong-password': 'Wrong password',
    'email-already-in-use': 'Email already in use, try to sign in instead',
    'invalid-credential': 'Invalid e-mail or password',
    'too-many-requests': 'Too many attempts, try again later',
    'network-request-failed': 'Network error, please try again',
  }

  const uid = computed(() => (user.value ? user.value.uid : ''))
  const logged = computed(() => user.value !== null)
  const email = computed(() => (user.value ? user.value.email : ''))

  const name = computed(() => {
    if (!user.value) return ''
    return user.value.displayName || user.value.email || ''
  })

  function setAfterLogin(url) {
    afterLogin.value = url || '/'
  }

  function clearError() {
    error.value = ''
  }

  function _setUser(newUser) {
    if (newUser) {
      user.value = {
        displayName: newUser.displayName,
        email: newUser.email,
        uid: newUser.uid,
        emailVerified: newUser.emailVerified,
      }
    } else {
      user.value = null
    }
  }

  function initAuth() {
    if (authReady.value) return Promise.resolve(user.value)
    if (authPromise.value) return authPromise.value

    authStarted.value = true

    authPromise.value = new Promise((resolve) => {
      let firstRun = true

      setAuthCallback((newUser) => {
        _setUser(newUser)

        if (firstRun) {
          authReady.value = true
          firstRun = false
          resolve(user.value)
        }
      })
    })

    return authPromise.value
  }

  async function signUserUp({ email, password }) {
    const result = await _doAction(createUser(email, password))

    if (result) {
      await sendVerificationEmail()
    }
    
    return result
  }

  async function signUserIn({ email, password }) {
    const result = await _doAction(logIn(email, password))
    return result
  }

  async function logout() {
    await _doAction(logOut())
    user.value = null
    setAfterLogin('/')
  }

  async function resetPasswordWithEmail(email) {
    return await _doAction(emailReset(email))
  }

  async function sendVerificationEmail() {
    return await _doAction(emailVerification())
  }

  async function _doAction(promise) {
    try {
      clearError()
      return await promise
    } catch (err) {
      const rawCode = err?.code || ''
      const code = rawCode.startsWith('auth/') ? rawCode.substring(5) : rawCode
      error.value = errorMessages[code] || code || 'Authentication error'
      return null
    }
  }

  return {
    user,
    authReady,
    authStarted,
    afterLogin,
    error,
    uid,
    logged,
    email,
    name,
    setAfterLogin,
    clearError,
    initAuth,
    signUserIn,
    signUserUp,
    logout,
    resetPasswordWithEmail,
    sendVerificationEmail,
  }
})