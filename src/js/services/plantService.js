// src/js/services/plantService.js

import { DATA_FILES, DIFFICULTY_LEVELS, TOXICITY_MAP } from '../utils/constants.js';

// --- Variabilă pentru cache ---
let cachedPlants = null;

// --- NOU: Wrapper robust pentru API-ul fetch ---

/**
 * Un wrapper pentru fetch care adaugă reîncercări (retries) și timeout.
 * @param {string} url - URL-ul resursei.
 * @param {object} [options={}] - Opțiuni pentru fetch, plus 'retries' și 'timeout'.
 * @returns {Promise<any>} Datele JSON parsate.
 * @private
 */
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
                // Aruncă eroarea finală după ce toate încercările au eșuat
                throw error;
            }
            // Așteaptă puțin înainte de a reîncerca (opțional, se poate adăuga backoff exponențial)
            await new Promise(res => setTimeout(res, 500 * (i + 1)));
        }
    }
}


// --- Funcții Helper (Private) ---

/**
 * Pre-procesează datele pentru o singură plantă.
 * @param {object} plant - Obiectul original al plantei.
 * @returns {object} Obiectul plantei cu datele suplimentare.
 * @private
 */
function preprocessPlantData(plant) {
    const difficultyConfig = DIFFICULTY_LEVELS.find(l => l.label === plant.difficulty?.toLowerCase()) || { value: 0, class: 'unknown' };
    const toxicityConfig = TOXICITY_MAP[plant.toxicityLevel] || TOXICITY_MAP.default;
    const growthRateMap = { 'lentă': 1, 'medie': 2, 'rapidă': 3 };

    return {
        ...plant,
        difficultyValue: difficultyConfig.value,
        difficultyClass: difficultyConfig.class,
        toxicityInfo: toxicityConfig,
        maxDifficulty: DIFFICULTY_LEVELS.length,
        growthRateValue: growthRateMap[plant.growth_rate] || 0,
        searchIndex: [
            plant.name || '',
            plant.latin || '',
            plant.category || '',
            ...(plant.tags || [])
        ].join(' ').toLowerCase(),
    };
}

// --- Funcții Publice (Exportate) ---

/**
 * MODIFICAT: Încarcă și pre-procesează datele plantelor folosind noul fetchWithRetries.
 * @returns {Promise<Array>} Lista de plante procesate.
 */
export async function loadAndProcessPlantsData() {
    if (cachedPlants) {
        return cachedPlants;
    }
    
    // Folosim noul wrapper pentru a prelua datele de la backend
    const rawPlantData = await fetchWithRetries('http://localhost:3000/api/plants');

    if (!Array.isArray(rawPlantData)) {
        throw new Error(`Datele primite de la API nu sunt un array valid.`);
    }

    cachedPlants = rawPlantData.map(preprocessPlantData);
    return cachedPlants;
}

/**
 * MODIFICAT: Preia detaliile complete pentru o singură plantă folosind noul fetchWithRetries.
 * @param {number} plantId - ID-ul plantei.
 * @returns {Promise<object>} Obiectul cu detaliile complete ale plantei.
 */
export async function fetchPlantDetails(plantId) {
    // Folosim noul wrapper
    return await fetchWithRetries(`http://localhost:3000/api/plants/${plantId}`);
}


/**
 * MODIFICAT: Încarcă datele pentru secțiunea FAQ folosind noul fetchWithRetries.
 * @returns {Promise<object>} Obiectul cu datele FAQ.
 */
export async function loadFaqData() {
    // Folosim noul wrapper
    const faqData = await fetchWithRetries(DATA_FILES.FAQ);

    if (!faqData || typeof faqData !== 'object' || Object.keys(faqData).length === 0) {
        throw new Error(`Datele din "${DATA_FILES.FAQ}" nu au formatul așteptat.`);
    }

    return faqData;
}