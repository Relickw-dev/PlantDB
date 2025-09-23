// src/js/core/state.js

import { DEFAULT_STATE } from '../utils/constants.js';

/**
 * NOU: O funcție care "îngheață" recursiv un obiect, făcându-l complet imutabil.
 * Aceasta previne orice modificare accidentală a stării în alte părți ale codului.
 * @param {object} obj - Obiectul de "înghețat".
 * @returns {object} Obiectul imutabil.
 */
function deepFreeze(obj) {
    Object.keys(obj).forEach(prop => {
        if (obj[prop] !== null && typeof obj[prop] === 'object') {
            deepFreeze(obj[prop]);
        }
    });
    return Object.freeze(obj);
}


/**
 * O funcție de clonare optimizată.
 * @param {object} obj - Obiectul de clonat.
 * @returns {object} O copie a obiectului.
 */
function shallowCloneWithDeepArrays(obj) {
    const newObj = { ...obj };
    for (const key in newObj) {
        if (Array.isArray(newObj[key])) {
            newObj[key] = [...newObj[key]];
        } else if (newObj[key] !== null && typeof newObj[key] === 'object' && newObj[key].constructor === Object) {
            newObj[key] = { ...newObj[key] };
        }
    }
    return newObj;
}


/**
 * Conține starea curentă a aplicației.
 * @private
 */
let state = { ...DEFAULT_STATE };

// --- LOGICA PRINCIPALĂ (Getters & Setters) ---

/**
 * MODIFICAT: Returnează o copie sigură și "înghețată" a stării curente.
 * @returns {object} O copie imutabilă a stării.
 */
export function getState() {
    const clonedState = shallowCloneWithDeepArrays(state);
    // Înghețăm starea clonată pentru a preveni orice mutație accidentală
    return deepFreeze(clonedState);
}

/**
 * Actualizează una sau mai multe proprietăți ale stării globale.
 * @param {Partial<typeof state>} newState - Un obiect cu noile valori.
 */
export function updateState(newState) {
    const oldStateForNotify = getState(); // Obținem o copie înghețată pentru notificare
    const nextState = { ...state };

    for (const key in newState) {
        if (!Object.hasOwn(DEFAULT_STATE, key)) {
            throw new Error(`[state] Încercare de a actualiza o cheie necunoscută: "${key}".`);
        }
        nextState[key] = newState[key];
    }
    
    state = nextState;
    notifyListeners(getState(), oldStateForNotify); // Trimitem noua stare înghețată
}

/**
 * Resetează complet starea la valorile implicite.
 */
export function resetState() {
    const oldState = getState();
    state = { ...DEFAULT_STATE };
    notifyListeners(getState(), oldState);
}

// --- SISTEMUL DE SUBSCRIBERE (Pub/Sub) ---
const { subscribe, notifyListeners } = (() => {
    const listeners = new Set();
    const notify = (currentState, oldState) => {
        listeners.forEach((callback) => {
            try {
                callback(currentState, oldState);
            } catch (err) {
                console.error("[state] Eroare într-un subscriber:", err);
            }
        });
    };
    const sub = (callback) => {
        if (typeof callback !== 'function') {
            console.error('[state] Subscriber-ul trebuie să fie o funcție.');
            return () => {};
        }
        listeners.add(callback);
        return () => listeners.delete(callback);
    };
    return { subscribe: sub, notifyListeners: notify };
})();

export { subscribe };