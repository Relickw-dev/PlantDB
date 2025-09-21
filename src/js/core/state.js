// src/js/core/state.js

import { DEFAULT_STATE } from '../utils/constants.js';

/**
 * NOU: O funcție de clonare optimizată.
 * Creează o copie superficială a obiectului principal și copii adânci doar pentru
 * array-uri și obiecte simple, ceea ce este mult mai performant decât structuredClone
 * pentru structura acestei aplicații.
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
 * Conține starea curentă a aplicației. NU este exportat direct pentru a preveni
 * mutațiile necontrolate. Este "coloana vertebrală" a aplicației.
 * @private
 */
let state = { ...DEFAULT_STATE };

// --- LOGICA PRINCIPALĂ (Getters & Setters) ---

/**
 * Returnează o copie sigură a stării curente.
 * Folosește o strategie de clonare optimizată pentru a preveni mutațiile externe
 * fără a sacrifica performanța.
 * @returns {object} O copie a stării curente.
 */
export function getState() {
    // MODIFICAT: Folosim noua funcție de clonare, mai performantă.
    return shallowCloneWithDeepArrays(state);
}

/**
 * Actualizează una sau mai multe proprietăți ale stării globale și notifică
 * toți ascultătorii despre schimbare.
 * @param {Partial<typeof state>} newState - Un obiect cu noile valori.
 * @throws {Error} Aruncă o eroare dacă se încearcă adăugarea unei chei care nu există în DEFAULT_STATE.
 */
export function updateState(newState) {
    const oldState = getState(); // Obținem o copie sigură a stării vechi

    const nextState = { ...state }; // Creăm o copie de lucru a stării curente

    for (const key in newState) {
        // MODIFICAT: Validare strictă a cheilor.
        // Previne adăugarea de proprietăți accidentale în stare.
        if (!Object.hasOwn(DEFAULT_STATE, key)) {
            // Aruncăm o eroare pentru a face problemele vizibile imediat.
            throw new Error(`[state] Încercare de a actualiza o cheie necunoscută: "${key}". Asigură-te că este definită în DEFAULT_STATE.`);
        }
        nextState[key] = newState[key];
    }
    
    // Actualizăm starea principală cu noile valori
    state = nextState;

    // Notificăm ascultătorii cu starea nouă (clonată) și cea veche.
    notifyListeners(getState(), oldState);
}

/**
 * Resetează complet starea la valorile implicite și notifică ascultătorii.
 */
export function resetState() {
    const oldState = getState();
    state = { ...DEFAULT_STATE };
    notifyListeners(getState(), oldState);
}

// --- SISTEMUL DE SUBSCRIBERE (Pub/Sub) ---
// Această secțiune este deja robustă și nu necesită modificări.

const { subscribe, notifyListeners } = (() => {
    const listeners = new Set();

    /**
     * Notifică toți ascultătorii despre o schimbare de stare.
     * @private
     * @param {object} currentState - Starea actuală, după modificare.
     * @param {object} oldState - Starea anterioară, înainte de modificare.
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
     * @param {(currentState: object, oldState: object) => void} callback - Funcția de apelat.
     * @returns {() => void} O funcție `unsubscribe` care elimină subscriber-ul.
     */
    const sub = (callback) => {
        if (typeof callback !== 'function') {
            console.error('[state] Subscriber-ul trebuie să fie o funcție.');
            return () => {}; // Returnează o funcție goală pentru a evita erori
        }
        listeners.add(callback);
        // Returnează o funcție care permite eliminarea listener-ului
        return () => listeners.delete(callback);
    };

    return { subscribe: sub, notifyListeners: notify };
})();

export { subscribe };