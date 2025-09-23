// src/js/store/rootReducer.js

/**
 * Creează reducer-ul rădăcină pe baza modulelor care au fost încărcate cu succes.
 * @param {Object[]} features - Lista de module încărcate.
 * @returns {Function} Reducer-ul combinat.
 */
export function createRootReducer(features) {
    // Colectează toate reducer-ele din modulele încărcate
    const reducers = features.reduce((acc, feature) => {
        if (feature.name && feature.reducer) {
            acc[feature.name] = feature.reducer;
        }
        return acc;
    }, {});

    // Returnează funcția finală de reducer
    return function rootReducer(state = {}, action) {
        const nextState = {};
        for (const key in reducers) {
            // Aplică fiecare reducer pe felia corespunzătoare de stare
            nextState[key] = reducers[key](state[key], action);
        }
        return { ...state, ...nextState };
    };
}