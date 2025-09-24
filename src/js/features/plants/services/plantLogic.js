// src/js/services/plantLogic.js

import { SORT_KEYS, PET_KEYWORDS, DIFFICULTY_LEVELS, TOXICITY_MAP } from '../../../shared/utils/constants.js';

/**
 * NOU: Pre-procesează datele pentru o singură plantă, adăugând câmpuri calculate.
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

/**
 * NOU: Exportăm o funcție care aplică pre-procesarea pe un întreg array de plante.
 * @param {Array<object>} plants - Lista de plante brute.
 * @returns {Array<object>} Lista de plante procesate.
 */
export function processAllPlants(plants) {
    if (!Array.isArray(plants)) {
        throw new Error(`Datele primite pentru procesare nu sunt un array valid.`);
    }
    return plants.map(preprocessPlantData);
}


// --- Strategii de Sortare ---
const SORT_STRATEGIES = {
    [SORT_KEYS.AZ]: (a, b) => a.name.localeCompare(b.name),
    [SORT_KEYS.ZA]: (a, b) => b.name.localeCompare(a.name),
    [SORT_KEYS.TOX_ASC]: (a, b) => a.toxicityLevel - b.toxicityLevel,
    [SORT_KEYS.TOX_DESC]: (a, b) => b.toxicityLevel - a.toxicityLevel,
    [SORT_KEYS.DIFF_ASC]: (a, b) => a.difficultyValue - b.difficultyValue,
    [SORT_KEYS.DIFF_DESC]: (a, b) => b.difficultyValue - a.difficultyValue,
    [SORT_KEYS.AIR_ASC]: (a, b) => (a.air_purifying_level || 0) - (b.air_purifying_level || 0),
    [SORT_KEYS.AIR_DESC]: (a, b) => (b.air_purifying_level || 0) - (a.air_purifying_level || 0),
    [SORT_KEYS.GROWTH_ASC]: (a, b) => (a.growthRateValue || 0) - (b.growthRateValue || 0),
    [SORT_KEYS.GROWTH_DESC]: (a, b) => (b.growthRateValue || 0) - (a.growthRateValue || 0),
};

// --- Strategii de Filtrare ---
const FILTER_STRATEGIES = {
    /** Filtrează pe baza textului din searchIndex. */
    byQuery: (plants, query) => {
        if (!query) return plants;
        return plants.filter(p => p.searchIndex.includes(query));
    },
    /** Filtrează pe baza tag-urilor active. */
    byTag: (plants, activeTags) => {
        if (!activeTags || activeTags.length === 0) {
            return plants;
        }
        return plants.filter(p =>
            activeTags.every(tag => p.tags?.includes(tag))
        );
    },
    /** Un filtru special care suprascrie celelalte dacă se caută după animale. */
    byPetFriendly: (plants, query) => {
        const isPetSearch = PET_KEYWORDS.some(keyword => query.includes(keyword));
        return isPetSearch ? plants.filter(p => p.toxicityLevel === 0) : plants;
    },
    /** Filtrează pentru a afișa doar plantele favorite. */
    byFavorites: (plants, favoriteIds) => {
        return plants.filter(p => favoriteIds.includes(p.id));
    }
};

// --- Funcții Helper ---
function filterPlants(plants, query, activeTags) {
    const normalizedQuery = query.toLowerCase().trim();

    if (PET_KEYWORDS.some(keyword => normalizedQuery.includes(keyword))) {
        return FILTER_STRATEGIES.byPetFriendly(plants, normalizedQuery);
    }

    const activeFilters = [
        (p) => FILTER_STRATEGIES.byQuery(p, normalizedQuery),
        (p) => FILTER_STRATEGIES.byTag(p, activeTags),
    ];

    return activeFilters.reduce((currentPlants, filterFunc) => {
        return filterFunc(currentPlants);
    }, plants);
}

function sortPlants(plants, sortOrder) {
    const comparator = SORT_STRATEGIES[sortOrder];
    return comparator ? [...plants].sort(comparator) : plants;
}

/**
 * Orchestrează filtrarea, sortarea și, opțional, filtrarea după favorite.
 */
export function getSortedAndFilteredPlants(plants, query, activeTags, sortOrder, favoritesFilterActive, favoriteIds) {
    const filtered = filterPlants(plants, query, activeTags);
    const sorted = sortPlants(filtered, sortOrder);

    if (favoritesFilterActive) {
        return FILTER_STRATEGIES.byFavorites(sorted, favoriteIds);
    }

    return sorted;
}

/**
 * Calculează plantele adiacente (precedentă/următoare) pentru navigație.
 */
export function getAdjacentPlants(plant, visiblePlants) {
    if (!plant || visiblePlants.length < 2) {
        return { prev: plant, next: plant };
    }
    
    const currentIndex = visiblePlants.findIndex(p => p.id === plant.id);
    if (currentIndex === -1) {
        return { prev: plant, next: plant };
    }

    const prevIndex = (currentIndex - 1 + visiblePlants.length) % visiblePlants.length;
    const nextIndex = (currentIndex + 1) % visiblePlants.length;
    
    return { 
        prev: visiblePlants[prevIndex], 
        next: visiblePlants[nextIndex] 
    };
}