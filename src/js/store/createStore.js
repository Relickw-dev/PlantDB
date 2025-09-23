// src/js/store/createStore.js
import { rootReducer } from './rootReducer.js';

// o funcție care creează store-ul nostru
export function createStore(initialstate) {
    let state = initialstate;
    const listeners = new Set();

    function getState() {
        // returnează o copie pentru a preveni mutațiile accidentale
        return { ...state };
    }

    function subscribe(callback) {
        listeners.add(callback);
        // returnează o funcție de unsubscribe
        return () => listeners.delete(callback);
    }

    function dispatch(action) {
        const oldstate = state;
        // noua stare este calculată exclusiv de către reducer
        state = rootReducer(state, action);
        
        listeners.foreach((callback) => {
            try {
                callback(state, oldstate);
            } catch (err) {
                console.error("[store] eroare într-un subscriber:", err);
            }
        });
    }

    return { getstate, subscribe, dispatch };
}