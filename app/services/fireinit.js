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

import { firebaseConfig } from '~/services/config'
// copia en /services/config.js el fichero .json con la configuración de firebase
// similar al ejemplo /services/config.js.example

const useEmulator = process.env.UseEmulator || false

let app
let auth
let db

export function initApp() {
    if (!app) {
        console.log('Inicializando firebase')
        app = initializeApp(firebaseConfig)
    }
    return app
}

function doInitAuth() {
    // Initialize Firebase
    if (!auth) {
        auth = getAuth(initApp())
        if (useEmulator) {
            connectAuthEmulator(auth, 'http://localhost:9099')
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

function getCurrentUserPromise(auth) {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                unsubscribe()
                resolve(user)
            },
            reject
        )
    })
}

export const getCurrentUser = async () => {
    const auth = doInitAuth()
    if (auth.currentUser) return auth.currentUser
    return await getCurrentUserPromise(auth)
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
    const auth = doInitAuth()
    if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser)
        return true
    } else {
        throw new Error('User not logged, can not send verification email')
    }
}

export function getDB() {
    if (!db) {
        db = getFirestore(initApp())
        if (useEmulator) {
            connectFirestoreEmulator(db, '127.0.0.1', 8080)
        }
    }
    return db
}
