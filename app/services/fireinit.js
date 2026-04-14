import { initializeApp } from 'firebase/app'

import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

let app
let auth
let db
let emulatorsConnected = false

function getFirebaseConfig() {
  const config = useRuntimeConfig()

  return {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
  }
}

function shouldUseEmulator() {
  const config = useRuntimeConfig()
  return config.public.useEmulator === 'true'
}

export function initApp() {
  if (!app) {
    const firebaseConfig = getFirebaseConfig()
    console.log('Firebase config check:', firebaseConfig)
    app = initializeApp(getFirebaseConfig())
  }
  return app
}

function doInitAuth() {
  if (!auth) {
    auth = getAuth(initApp())

    if (shouldUseEmulator() && !emulatorsConnected) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099')
    }
  }

  return auth
}

export function setAuthCallback(userCallback) {
  if (userCallback) {
    auth = doInitAuth()
    onAuthStateChanged(auth, userCallback)
  }
  return auth
}

function getCurrentUserPromise(authInstance) {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      authInstance,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject
    )
  })
}

export const getCurrentUser = async () => {
  const authInstance = doInitAuth()
  if (authInstance.currentUser) return authInstance.currentUser
  return await getCurrentUserPromise(authInstance)
}

export async function createUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(
    doInitAuth(),
    email,
    password
  )
  return userCredential ? userCredential.user : null
}

export async function logIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    doInitAuth(),
    email,
    password
  )
  return userCredential ? userCredential.user : null
}

export async function logOut() {
  await signOut(doInitAuth())
}

export async function emailReset(email) {
  await sendPasswordResetEmail(doInitAuth(), email)
}

export async function emailVerification() {
  const authInstance = doInitAuth()
  if (authInstance.currentUser) {
    await sendEmailVerification(authInstance.currentUser)
    return true
  }
  throw new Error('User not logged, cannot send verification email')
}

export function getDB() {
  if (!db) {
    db = getFirestore(initApp())

    if (shouldUseEmulator() && !emulatorsConnected) {
      connectFirestoreEmulator(db, '127.0.0.1', 8080)
      emulatorsConnected = true
    }
  }

  return db
}