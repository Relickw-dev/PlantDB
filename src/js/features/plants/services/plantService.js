// src/js/services/plantService.js

import { DATA_FILES } from '../../../shared/utils/constants.js';

// --- Variabilă pentru cache ---
let cachedPlants = null;

// --- Wrapper robust pentru API-ul fetch ---
async function fetchWithRetries(url, options = {}) {
    const { retries = 2, timeout = 8000, ...fetchOptions } = options;

    for (let i = 0; i <= retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Eroare HTTP ${response.status} la încărcarea fișierului: ${url}`);
            }
            
            const text = await response.text();
            if (!text) {
                throw new Error(`Fișierul JSON de la ${url} este gol.`);
            }
            return JSON.parse(text);

        } catch (error) {
            if (i === retries) {
                throw error;
            }
            await new Promise(res => setTimeout(res, 500 * (i + 1)));
        }
    }
}


// --- Funcții Publice (Exportate) ---

/**
 * MODIFICAT: Încarcă datele plantelor, dar NU le mai procesează.
 * Doar le preia și le pune în cache.
 * @returns {Promise<Array>} Lista de plante brute.
 */
export async function fetchAllPlants() {
    if (cachedPlants) {
        return cachedPlants;
    }
    
    const rawPlantData = await fetchWithRetries('http://localhost:3000/api/plants');

    if (!Array.isArray(rawPlantData)) {
        throw new Error(`Datele primite de la API nu sunt un array valid.`);
    }

    cachedPlants = rawPlantData;
    return cachedPlants;
}

/**
 * Preia detaliile complete pentru o singură plantă.
 * @param {number} plantId - ID-ul plantei.
 * @returns {Promise<object>} Obiectul cu detaliile complete ale plantei.
 */
export async function fetchPlantDetails(plantId) {
    return await fetchWithRetries(`http://localhost:3000/api/plants/${plantId}`);
}


/**
 * Încarcă datele pentru secțiunea FAQ.
 * @returns {Promise<object>} Obiectul cu datele FAQ.
 */
export async function loadFaqData() {
    const faqData = await fetchWithRetries(DATA_FILES.FAQ);

    if (!faqData || typeof faqData !== 'object' || Object.keys(faqData).length === 0) {
        throw new Error(`Datele din "${DATA_FILES.FAQ}" nu au formatul așteptat.`);
    }

    return faqData;
}