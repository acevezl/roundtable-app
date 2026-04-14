import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    setDoc,
    updateDoc,
} from 'firebase/firestore'

import { getDB } from '~/services/fireinit'

export const useFirestore = (defaultPath = '') => {
    const path = ref(defaultPath)
    const error = ref('')
    const listener = ref()

    function getCollection() {
        return collection(getDB(), path.value)
    }

    function clearError() {
        error.value = ''
    }

    function setPath(newPath) {
        if (path.value !== newPath) {
            path.value = newPath
            if (listener.value) {
                setListener(null)
            }
        }
    }

    /**
     *
     * @param d document
     * @returns {Promise<string>} Promise with the id
     */
    async function add(d) {
        const docRef = await addDoc(getCollection(), d)
        return docRef.id
    }

    async function remove(id) {
        await deleteDoc(getDocRef(id))
    }

    function getDocRef(id) {
        return doc(getCollection(), id)
    }

    async function update(id, changes, useDocNotation = false) {
        if (useDocNotation) await updateDoc(getDocRef(id), changes)
        else await setDoc(getDocRef(id), changes, { merge: true })
    }

    function setError(error) {
        error.value = error.message
    }

    function setListener(l) {
        // if (l) console.log('subscrito')
        if (listener.value) {
            if (l)
                console.warn(
                    'Cambiado listener sin desubscribirse previamente, forzando desubscripción'
                )
            listener.value()
        }
        listener.value = l
        clearError()
    }

    const listening = computed(() => !!listener.value)

    return {
        path,
        error,
        listener,
        setPath,
        clearError,
        add,
        update,
        getCollection,
        getDocRef,
        setListener,
        setError,
        listening,
        remove,
    }
}
