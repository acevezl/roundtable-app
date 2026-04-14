import { onSnapshot } from 'firebase/firestore'

import { useFirestore } from '~/composables/useFirestore'

export const useFirestoreDoc = (defaultPath = '', defaultId = '') => {
    const {
        path,
        error,
        clearError,
        add: _add,
        setPath: _setPath,
        update: _update,
        getDocRef,
        setListener,
        setError,
        listener,
        listening,
    } = useFirestore(defaultPath)

    const doc = ref()
    const id = ref(defaultId)

    function unsubscribe() {
        if (listening.value) {
            setListener(null)
            doc.value = undefined
        }
    }

    function onDocChange(snapshot) {
        doc.value = snapshot.exists ? snapshot.data() : undefined
    }

    function getRef() {
        return getDocRef(id.value)
    }

    function subscribe() {
        // si ha cambiado hay que dejar de escuchar primero
        if (listener.value) {
            unsubscribe()
        }
        if (path.value && id.value) {
            setListener(
                onSnapshot(getRef(), onDocChange, (err) => {
                    setError(err)
                    // err.code contiene los códigos de error: https://github.com/grpc/grpc/blob/master/doc/statuscodes.md
                })
            )
        }
    }

    async function add(doc) {
        const ref = await _add(doc)
        setId(ref.id)
    }

    async function update(changes, useDocNotation = false) {
        await _update(id.value, changes, useDocNotation)
    }

    function setPath(newPath) {
        const resubscribe = listening.value
        _setPath(newPath)
        if (newPath && resubscribe) subscribe()
    }

    function setId(newId) {
        if (id.value !== newId) {
            id.value = newId
            if (listening.value) {
                setListener(null)
                subscribe()
            }
        }
    }

    return {
        path,
        listener,
        error,
        doc,
        id,
        subscribe,
        unsubscribe,
        clearError,
        add,
        update,
        setId,
        setPath,
    }
}
