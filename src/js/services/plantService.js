import { DATA_FILES, DIFFICULTY_LEVELS, TOXICITY_MAP } from '../utils/constants.js';


// --- Funcții Helper (Private) ---

let cachedPlants = null;

/**
 * O funcție generică pentru a încărca și parsa orice fișier JSON de la o adresă URL.
 * Aruncă o eroare dacă fetch-ul eșuează, permițând funcțiilor care o apelează
 * să gestioneze eroarea într-un mod specific.
 * @param {string} url - Calea către fișierul JSON.
 * @returns {Promise<any>} Datele JSON parsate.
 * @private
 */
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Eroare HTTP ${response.status} pentru URL: ${url}`);
    }
    return response.json();
}

/**
 * Pre-procesează datele pentru o singură plantă, adăugând câmpuri calculate
 * pentru a optimiza căutarea și sortarea.
 * @param {object} plant - Obiectul original al plantei.
 * @returns {object} Obiectul plantei cu datele suplimentare.
 * @private
 */
function preprocessPlantData(plant) {
    const difficultyConfig = DIFFICULTY_LEVELS.find(l => l.label === plant.difficulty?.toLowerCase()) || { value: 0, class: 'unknown' };
    const toxicityConfig = TOXICITY_MAP[plant.toxicityLevel] || TOXICITY_MAP.default;


    return {
        ...plant,
        difficultyValue: difficultyConfig.value,
        difficultyClass: difficultyConfig.class,
        toxicityInfo: toxicityConfig, // Trimitem tot obiectul cu icon, text și clasă
        maxDifficulty: DIFFICULTY_LEVELS.length,
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
 * Încarcă și pre-procesează datele plantelor.
 * Propagă erorile de rețea către apelant pentru a fi gestionate centralizat.
 * @returns {Promise<Array>} Lista de plante procesate.
 */
export async function loadAndProcessPlantsData() {
    if (cachedPlants) {
        return cachedPlants; // Returnează direct din cache
    }
    const rawPlantData = await fetchJSON(DATA_FILES.PLANTS);
    if (!Array.isArray(rawPlantData)) {
        console.warn(`Datele din "${DATA_FILES.PLANTS}" nu sunt un array.`);
        return [];
    }
    cachedPlants = rawPlantData.map(preprocessPlantData); // Salvează în cache
    return cachedPlants;
}

/**
 * Încarcă datele pentru secțiunea FAQ.
 * Gestionează propriile erori și afișează o notificare specifică.
 * @returns {Promise<object|null>} Obiectul cu datele FAQ.
 */
export async function loadFaqData() {
  
        const faqData = await fetchJSON(DATA_FILES.FAQ);
        if (!faqData || !faqData.faq_general) {
            console.warn(`Datele din "${DATA_FILES.FAQ}" nu au formatul așteptat.`);
            return null;
        }
        return faqData;
}