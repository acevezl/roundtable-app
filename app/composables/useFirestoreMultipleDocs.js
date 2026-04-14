import { documentId } from 'firebase/firestore'
import { isEqual } from 'es-toolkit'
import { useFirestoreCollection } from '~/composables/useFirestoreCollection.js'

export const useFirestoreMultipleDocs = (defaultPath = '', defaultIds = []) => {
    const {
        path,
        documents,
        listener,
        listening,
        error,
        docsArray,
        subscribe,
        unsubscribe,
        setPath,
        setFilter,
        clearError,
        add: _add,
        update,
    } = useFirestoreCollection(defaultPath)

    const ids = ref(defaultIds)

    function getFilter() {
        const field = documentId()
        return [[field, 'in', ids.value]]
    }

    setFilter(getFilter())

    /**
     *
     * @param newIds array of ids
     */
    function setIds(newIds) {
        if (!isEqual(newIds, ids.value)) {
            ids.value = newIds
            setFilter(getFilter())
        }
    }

    async function add(doc) {
        const ref = await _add(doc)
        if (!ids.value.includes(ref.id)) setIds([...ids.value, ref.id])
    }

    return {
        path,
        documents,
        listener,
        error,
        ids,
        docsArray,
        listening,
        unsubscribe,
        setPath,
        setIds,
        subscribe,
        clearError,
        update,
        add,
    }
}
