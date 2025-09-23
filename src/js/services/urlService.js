// src/js/services/urlService.js
import { URL_PARAMS, HASH_PREFIXES, SORT_KEYS } from '../utils/constants.js';

/**
 * Construiește partea de hash a URL-ului pe baza stării modulare.
 * @param {object} state - Starea globală a aplicației.
 * @returns {string} Hash-ul generat.
 * @private
 */
function buildHashFromState(state) {
    // Verificăm starea din modulul 'plants'
    if (state.plants?.modalPlant && state.plants.modalPlant.current) {
        return `${HASH_PREFIXES.PLANT}${state.plants.modalPlant.current.id}`;
    }
    // Verificăm starea din modulul 'faq'
    if (state.faq?.isOpen) {
        return HASH_PREFIXES.FAQ;
    }
    return '';
}

/**
 * Extrage starea aplicației din URL-ul curent.
 * @returns {object} Un obiect reprezentând starea extrasă, gata pentru a fi dispecerizată.
 */
export function getStateFromURL(location = window.location) {
    const params = new URLSearchParams(location.search);
    const hash = location.hash;
    const state = {};

    const query = params.get(URL_PARAMS.QUERY);
    const sortOrder = params.get(URL_PARAMS.SORT);
    const tagParam = params.get(URL_PARAMS.TAG);

    if (query) state.query = query;
    if (sortOrder) state.sortOrder = sortOrder;
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
 * Actualizează URL-ul pe baza stării curente, modulare.
 * @param {object} state - Starea globală curentă.
 */
export function updateURLFromState(state, location = window.location, history = window.history) {
    const params = new URLSearchParams();
    const { plants } = state; // Extragem "felia" de stare a plantelor

    if (plants.query) params.set(URL_PARAMS.QUERY, plants.query);
    if (plants.sortOrder !== SORT_KEYS.AZ) params.set(URL_PARAMS.SORT, plants.sortOrder);

    if (plants.activeTags && plants.activeTags.length > 0) {
        const encodedTags = plants.activeTags.map(tag => encodeURIComponent(tag)).join(',');
        params.set(URL_PARAMS.TAG, encodedTags);
    }

    // Hash-ul este construit pe baza întregii stări
    const hash = buildHashFromState(state);

    const url = new URL(location.href);
    url.search = params.toString();
    url.hash = hash;

    const newUrl = url.toString();

    if (location.href !== newUrl) {
        history.replaceState(null, '', newUrl);
    }
}