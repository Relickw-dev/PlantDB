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
    
    // Transformăm string-ul din URL (ex: "tag1,tag2") înapoi în array
    if (tagParam) {
        state.activeTags = tagParam.split(',');
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
    
    // Transformăm array-ul de tag-uri active într-un singur string, separat prin virgulă
    if (state.activeTags && state.activeTags.length > 0) {
        params.set(URL_PARAMS.TAG, state.activeTags.join(','));
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