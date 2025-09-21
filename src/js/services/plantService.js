import { DATA_FILES, DIFFICULTY_LEVELS, TOXICITY_MAP } from '../utils/constants.js';

// --- Variabilă pentru cache ---
let cachedPlants = null;

// --- Funcții Helper (Private) ---

/**
 * O funcție generică pentru a încărca și parsa orice fișier JSON.
 * Aruncă o eroare detaliată dacă fetch-ul eșuează, permițând o gestionare
 * centralizată și specifică a erorilor în modulele care o apelează.
 * @param {string} url - Calea către fișierul JSON.
 * @returns {Promise<any>} Datele JSON parsate.
 * @private
 */
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        // Aruncăm o eroare specifică pentru a fi prinsă de apelant
        throw new Error(`Eroare HTTP ${response.status} la încărcarea fișierului: ${url}`);
    }
    // Verificăm dacă răspunsul este gol înainte de a încerca să-l parcurgem
    const text = await response.text();
    if (!text) {
        throw new Error(`Fișierul JSON de la ${url} este gol.`);
    }
    return JSON.parse(text);
}

/**
 * Pre-procesează datele pentru o singură plantă, adăugând câmpuri calculate
 * și gestionând valori lipsă pentru a optimiza căutarea, sortarea și afișarea.
 * @param {object} plant - Obiectul original al plantei.
 * @returns {object} Obiectul plantei cu datele suplimentare.
 * @private
 */
function preprocessPlantData(plant) {
    // --- PATCH: Valori implicite pentru a preveni erorile dacă datele lipsesc ---
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
        // --- PATCH: Asigurăm că `tags` este un array înainte de a-l folosi ---
        searchIndex: [
            plant.name || '',
            plant.latin || '',
            plant.category || '',
            ...(plant.tags || []) // Folosim un array gol dacă `tags` nu există
        ].join(' ').toLowerCase(),
    };
}

// --- Funcții Publice (Exportate) ---

/**
 * MODIFICAT: Încarcă și pre-procesează datele plantelor de la API-ul backend.
 * Propagă erorile de rețea sau de format de date către apelant.
 * @returns {Promise<Array>} Lista de plante procesate.
 */
export async function loadAndProcessPlantsData() {
    if (cachedPlants) {
        return cachedPlants; // Returnează direct din cache pentru performanță
    }

    // --- AICI ESTE MODIFICAREA PRINCIPALĂ ---
    // Înlocuim calea către fișierul JSON cu URL-ul către serverul nostru.
    const response = await fetch('http://localhost:3000/api/plants');

    if (!response.ok) {
        throw new Error(`Eroare HTTP ${response.status} la preluarea datelor de la API.`);
    }

    const rawPlantData = await response.json();

    if (!Array.isArray(rawPlantData)) {
        throw new Error(`Datele primite de la API nu sunt un array valid.`);
    }

    cachedPlants = rawPlantData.map(preprocessPlantData); // Salvează în cache
    return cachedPlants;
}

/**
 * ADAUGAT: Preia detaliile complete pentru o singură plantă de la API.
 * Această funcție este cheia pentru a încărca dinamic datele în modal.
 * @param {number} plantId - ID-ul plantei.
 * @returns {Promise<object>} Obiectul cu detaliile complete ale plantei.
 */
export async function fetchPlantDetails(plantId) {
    const response = await fetch(`http://localhost:3000/api/plants/${plantId}`);
    if (!response.ok) {
        throw new Error(`Eroare HTTP ${response.status} la preluarea detaliilor pentru planta cu ID ${plantId}.`);
    }
    return response.json();
}


/**
 * Încarcă datele pentru secțiunea FAQ.
 * Propagă erorile pentru a fi gestionate centralizat.
 * @returns {Promise<object>} Obiectul cu datele FAQ.
 */
export async function loadFaqData() {
    // --- PATCH: Eliminat try...catch pentru a lăsa `actions.js` să gestioneze eroarea ---
    // Acest lucru permite o strategie de gestionare a erorilor mai consistentă în aplicație.
    const faqData = await fetchJSON(DATA_FILES.FAQ);

    // --- PATCH: Validare minimă a structurii datelor ---
    if (!faqData || typeof faqData !== 'object' || Object.keys(faqData).length === 0) {
        throw new Error(`Datele din "${DATA_FILES.FAQ}" nu au formatul așteptat.`);
    }

    return faqData;
}