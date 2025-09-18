// NOU: Importăm constantele necesare
import { SORT_KEYS, PET_KEYWORDS } from '../utils/constants.js';

// ȘTERS: Constanta PET_KEYWORDS a fost mutată în constants.js

// --- Strategii de Sortare ---
// MODIFICAT: Folosim chei din constante în loc de string-uri
const SORT_STRATEGIES = {
    [SORT_KEYS.AZ]: (a, b) => a.name.localeCompare(b.name),
    [SORT_KEYS.ZA]: (a, b) => b.name.localeCompare(a.name),
    [SORT_KEYS.TOX_ASC]: (a, b) => a.toxicityLevel - b.toxicityLevel,
    [SORT_KEYS.TOX_DESC]: (a, b) => b.toxicityLevel - a.toxicityLevel,
    [SORT_KEYS.DIFF_ASC]: (a, b) => a.difficultyValue - b.difficultyValue,
    [SORT_KEYS.DIFF_DESC]: (a, b) => b.difficultyValue - a.difficultyValue,
};

// --- Strategii de Filtrare ---
const FILTER_STRATEGIES = {
    /** Filtrează pe baza textului din searchIndex. */
    byQuery: (plants, query) => {
        if (!query) return plants;
        return plants.filter(p => p.searchIndex.includes(query));
    },
    /** Filtrează pe baza tag-ului activ. */
    byTag: (plants, activeTags) => {
        if (!activeTags || activeTags.length === 0) {
            return plants; // Dacă nu sunt tag-uri active, returnăm tot
        }
        // Returnează doar plantele care au TOATE tag-urile din lista activă
        return plants.filter(p => 
            activeTags.every(tag => p.tags?.includes(tag))
        );
    },
    /** Un filtru special care suprascrie celelalte dacă se caută după animale. */
    byPetFriendly: (plants, query) => {
        // MODIFICAT: Folosește PET_KEYWORDS importat
        const isPetSearch = PET_KEYWORDS.some(keyword => query.includes(keyword));
        return isPetSearch ? plants.filter(p => p.toxicityLevel === 0) : plants;
    }
};

// --- Funcții Principale (Publice) ---

/**
 * Aplică o serie de filtre asupra unei liste de plante.
 * Gestionează cazul special "pet-friendly".
 * @param {Array} plants - Lista de plante de filtrat.
 * @param {string} query - Termenul de căutare.
 * @param {string} activeTag - Tag-ul selectat.
 * @returns {Array} Lista de plante filtrate.
 * @private
 */
function filterPlants(plants, query, activeTags) {
    const normalizedQuery = query.toLowerCase().trim();

    if (PET_KEYWORDS.some(keyword => normalizedQuery.includes(keyword))) {
        return FILTER_STRATEGIES.byPetFriendly(plants, normalizedQuery);
    }

    const activeFilters = [
        (p) => FILTER_STRATEGIES.byQuery(p, normalizedQuery),
        (p) => FILTER_STRATEGIES.byTag(p, activeTags), // MODIFICAT
    ];

    return activeFilters.reduce((currentPlants, filterFunc) => {
        return filterFunc(currentPlants);
    }, plants);
}

/**
 * Sortează o listă de plante pe baza ordinii specificate.
 * @param {Array} plants - Lista de plante de sortat.
 * @param {string} sortOrder - Cheia strategiei de sortare.
 * @returns {Array} Lista de plante sortate.
 * @private
 */
function sortPlants(plants, sortOrder) {
    const comparator = SORT_STRATEGIES[sortOrder];
    return comparator ? [...plants].sort(comparator) : plants;
}

/**
 * Funcția principală exportată care orchestrează filtrarea și sortarea.
 * @param {Array} plants - Lista completă de plante.
 * @param {string} query - Termenul de căutare.
 * @param {string} activeTag - Tag-ul selectat.
 * @param {string} sortOrder - Ordinea de sortare.
 * @returns {Array} Lista finală de plante, filtrate și sortate.
 */
export function getSortedAndFilteredPlants(plants, query, activeTags, sortOrder) {
    const filtered = filterPlants(plants, query, activeTags);
    const sorted = sortPlants(filtered, sortOrder);
    return sorted;
}