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
    const authInit = ref(false)
    const afterLogin = ref('/') // where to go after login completes
    const error = ref('') // last auth error message
    const errorCode = ref({
        'invalid-email': 'Invalid e-mail',
        'user-disabled': 'User account is disabled',
        'user-not-found': 'User not found, try to sign up instead',
        'wrong-password': 'Wrong password',
        'email-already-in-use': 'Email already in use, try to sign in instead',
    })

    const uid = computed(() => (user.value ? user.value.uid : ''))
    const logged = computed(() => user.value !== null)
    const email = computed(() => (user.value ? user.value.email : ''))

    const name = computed(() =>
        user.value
            ? user.value.displayName
                ? user.value.displayName
                : user.value.email
            : ''
    )

    function setAfterLogin(url) {
        // console.log('Afterlogin changed from: ' + afterLogin.value + ' to: ' + url)
        afterLogin.value = url
    }

    function clearError() {
        error.value = ''
    }

    async function signUserUp({ email, password }) {
        await _doAction(createUser(email, password))
        return user.value
    }

    async function signUserIn({ email, password }) {
        await _doAction(logIn(email, password))
        return user.value
    }

    async function logout() {
        await _doAction(logOut())
    }

    async function resetPasswordWithEmail(email) {
        await _doAction(emailReset(email))
    }

    async function sendVerificationEmail() {
        await _doAction(emailVerification())
    }

    function initAuth() {
        if (!authInit.value) {
            authInit.value = true
            setAuthCallback((newUser) => {
                if (newUser)
                    user.value = {
                        displayName: newUser.displayName,
                        email: newUser.email,
                        uid: newUser.uid,
                        emailVerified: newUser.emailVerified,
                    }
                else user.value = null
            })
        }
        return authInit.value
    }

    async function _doAction(promise) {
        // internal function to capture auth errors
        try {
            clearError()
            return await promise
        } catch (err) {
            const code = err.code.substring(5)
            error.value = errorCode.value[code] || code
            return null
        }
    }

    return {
        user,
        authInit,
        afterLogin,
        error,
        errorCode,
        uid,
        logged,
        email,
        name,
        setAfterLogin,
        clearError,
        signUserIn,
        signUserUp,
        logout,
        resetPasswordWithEmail,
        sendVerificationEmail,
        initAuth,
    }
})
