import { DEFAULT_STATE } from '../utils/constants.js';

// --- UTILITAR INTERN ---



/**
 * Conține starea curentă a aplicației. NU este exportat direct pentru a preveni
 * mutațiile necontrolate. Este "coloana vertebrală" a aplicației.
 * @private
 */
let state = { ...DEFAULT_STATE };


// --- LOGICA PRINCIPALĂ (Getters & Setters) ---

/**
 * Returnează o copie adâncă a stării. Acesta este singurul mod prin care
 * alte module ar trebui să CITEASCĂ starea, prevenind mutațiile externe.
 * @returns {object} O copie adâncă a stării curente.
 */
export function getState() {
    return structuredClone(state);
}

/**
 * Actualizează una sau mai multe proprietăți ale stării globale și notifică
 * toți ascultătorii despre schimbare.
 * @param {Partial<typeof state>} newState - Un obiect cu noile valori.
 */
export function updateState(newState) {
    // Trimitem o copie adâncă a stării vechi către ascultători.
    const oldState = structuredClone(state);

    for (const key in newState) {
        if (Object.hasOwn(DEFAULT_STATE, key)) {
            state[key] = newState[key];
        } else {
            console.warn(`[state] Cheia necunoscută: "${key}" va fi ignorată.`);
        }
    }
    
    // Trimitem și o copie adâncă a noii stări.
    notifyListeners(structuredClone(state), oldState);
}

/**
 * Resetează complet starea la valorile implicite.
 */
export function resetState() {
    // Trimitem o copie adâncă a stării vechi către ascultători.
    const oldState = structuredClone(state);
    state = { ...DEFAULT_STATE };
    // Trimitem și o copie adâncă a noii stări.
    notifyListeners(structuredClone(state), oldState);
}


// --- SISTEMUL DE SUBSCRIBERE (Pub/Sub) ---

const { subscribe, notifyListeners } = (() => {
    const listeners = new Set();

    /**
     * Notifică toți ascultătorii despre o schimbare de stare.
     * @private
     */
    const notify = (currentState, oldState) => {
        listeners.forEach((callback) => {
            try {
                callback(currentState, oldState);
            } catch (err) {
                console.error("[state] Eroare într-un subscriber:", err);
            }
        });
    };

    /**
     * Adaugă o funcție (subscriber) care va fi apelată la fiecare schimbare a stării.
     * @returns {() => void} O funcție `unsubscribe` care elimină subscriber-ul.
     */
    const sub = (callback) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
    };

    return { subscribe: sub, notifyListeners: notify };
})();

export { subscribe };