/// src/js/store/createStore.js

// ELIMINAT: import { rootReducer } from './rootReducer.js';

export function createStore(initialState, rootReducer) { // MODIFICAT: rootReducer este acum un parametru
    let state = initialState;
    const listeners = new Set();

    function getState() {
        // Returnează o copie pentru a preveni mutațiile accidentale
        return JSON.parse(JSON.stringify(state));
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