import { onSnapshot, query, where } from 'firebase/firestore'
import { isEqual } from 'es-toolkit'

import { useFirestore } from '~/composables/useFirestore'

export const useFirestoreCollection = (
    defaultPath = '',
    defaultFilter = []
) => {
    const {
        path,
        error,
        clearError,
        add,
        setPath: _setPath,
        update,
        getCollection,
        setError,
        setListener,
        listener,
        listening,
        remove,
    } = useFirestore(defaultPath)

    const filter = ref(defaultFilter)
    const documents = ref({})
    const ids = computed(() => [...Object.keys(documents.value)].sort())

    const docsArray = computed(() =>
        ids.value.map((id) => ({ id, ...documents.value[id] }))
    )

    function unsubscribe() {
        setListener(null)
        documents.value = {}
    }

    function getQuery() {
        const col = getCollection()
        if (filter.value.length > 0)
            return query(
                col,
                ...filter.value.map((f) => where(f[0], f[1], f[2]))
            )
        else return col
    }

    function onSnapshotChange(change) {
        const { type, doc } = change
        if (type === 'added' || type === 'modified') {
            documents.value[doc.id] = doc.data()
        }
        if (type === 'removed') {
            delete documents.value[doc.id]
        }
    }

    function setPath(newPath) {
        const resubscribe = listening.value
        _setPath(newPath)
        if (newPath && resubscribe) subscribe()
    }

    /**
     *
     * @param newFilter where clause conditions as array of [field, firestore query operator, value] elements
     */
    function setFilter(newFilter) {
        if (!isEqual(filter.value, newFilter)) {
            const resubscribe = listening.value
            unsubscribe()
            filter.value = newFilter
            if (resubscribe) subscribe()
        }
    }

    function subscribe() {
        if (!listening.value && path.value) {
            // hace falta volver a subscribirse
            setListener(
                onSnapshot(
                    getQuery(),
                    (snapshot) => {
                        snapshot.docChanges().forEach(onSnapshotChange)
                    },
                    (err) => {
                        setError(err)
                        // err.code contiene los códigos de error: https://github.com/grpc/grpc/blob/master/doc/statuscodes.md
                    }
                )
            )
        }
    }

    return {
        path,
        filter,
        documents,
        listener,
        listening,
        error,
        ids,
        docsArray,
        unsubscribe,
        subscribe,
        setPath,
        setFilter,
        clearError,
        setError,
        add,
        update,
        remove,
    }
}
