/// src/js/store/createStore.js


export function createStore(initialState, rootReducer) { 
    let state = initialState;
    const listeners = new Set();

    function getState() {
        // Returnează o copie pentru a preveni mutațiile accidentale
        return state;
    }

    function subscribe(callback) {
        listeners.add(callback);
        return () => listeners.delete(callback);
    }

    function dispatch(action) {
        // Dacă acțiunea este o funcție (thunk), o executăm
        if (typeof action === 'function') {
            return action(dispatch, getState);
        }

        // Altfel, este un obiect acțiune pe care îl trimitem la reducer
        const oldState = getState();
        
        // MODIFICAT: Folosim reducer-ul primit ca parametru
        if (typeof rootReducer === 'function') {
            state = rootReducer(state, action);
        }
        
        listeners.forEach((callback) => {
            try {
                callback(getState(), oldState);
            } catch (err) {
                console.error("[store] eroare într-un subscriber:", err);
            }
        });
    }

    return { getState, subscribe, dispatch };
}