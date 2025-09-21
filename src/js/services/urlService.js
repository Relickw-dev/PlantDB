import { URL_PARAMS, HASH_PREFIXES, SORT_KEYS } from '../utils/constants.js';

/**
 * Construiește partea de hash a URL-ului pe baza stării aplicației.
 * @param {object} state - Starea curentă a aplicației.
 * @returns {string} Hash-ul generat (ex: '#plant-12') sau un string gol.
 * @private
 */
function buildHashFromState(state) {
    if (state.modalPlant && state.modalPlant.current) {
        return `${HASH_PREFIXES.PLANT}${state.modalPlant.current.id}`;
    }
    if (state.isFaqOpen) {
        return HASH_PREFIXES.FAQ;
    }
    return '';
}

/**
 * MODIFICAT: Extrage starea aplicației din URL-ul curent, suportând tag-uri multiple.
 * @returns {object} Un obiect reprezentând starea extrasă.
 */
export function getStateFromURL(location = window.location) {
    const params = new URLSearchParams(location.search);
    const hash = location.hash;
    const state = {};

    const query = params.get(URL_PARAMS.QUERY);
    const sortOrder = params.get(URL_PARAMS.SORT);
    const tagParam = params.get(URL_PARAMS.TAG); // Obținem parametrul ca string

    if (query) state.query = query;
    if (sortOrder) state.sortOrder = sortOrder;

    // <-- MODIFICAT: Decodăm fiecare tag individual pentru a gestiona virgulele
    if (tagParam) {
        state.activeTags = tagParam.split(',').map(tag => decodeURIComponent(tag));
    }

    if (hash && hash.startsWith(HASH_PREFIXES.PLANT)) {
        const plantId = parseInt(hash.substring(HASH_PREFIXES.PLANT.length), 10);
        if (!isNaN(plantId)) {
            state.modalPlantId = plantId;
        }
    } else if (hash === HASH_PREFIXES.FAQ) {
        state.isFaqOpen = true;
    }

    return state;
}

/**
 * MODIFICAT: Actualizează URL-ul pe baza stării curente, suportând tag-uri multiple.
 * @param {object} state - Starea curentă a aplicației.
 */
export function updateURLFromState(state, location = window.location, history = window.history) {
    const params = new URLSearchParams();

    if (state.query) params.set(URL_PARAMS.QUERY, state.query);
    if (state.sortOrder !== SORT_KEYS.AZ) params.set(URL_PARAMS.SORT, state.sortOrder);

    // <-- MODIFICAT: Codăm fiecare tag individual înainte de a le uni
    if (state.activeTags && state.activeTags.length > 0) {
        const encodedTags = state.activeTags.map(tag => encodeURIComponent(tag)).join(',');
        params.set(URL_PARAMS.TAG, encodedTags);
    }

    const hash = buildHashFromState(state);

    const url = new URL(location.href);
    url.search = params.toString();
    url.hash = hash;

    const newUrl = url.toString();

    if (location.href !== newUrl) {
        history.replaceState(null, '', newUrl);
    }
}