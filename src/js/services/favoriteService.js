const FAVORITES_KEY = 'plantAppFavorites';

/**
 * Preia ID-urile plantelor favorite din localStorage.
 * @returns {number[]} Un array de ID-uri.
 */
export function getFavorites() {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
}

/**
 * Salvează un array de ID-uri în localStorage.
 * @param {number[]} favoriteIds - Array-ul de ID-uri de salvat.
 */
function saveFavorites(favoriteIds) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
}

/**
 * Adaugă un ID de plantă la favorite.
 * @param {number} plantId - ID-ul plantei.
 */
export function addFavorite(plantId) {
    const favorites = getFavorites();
    if (!favorites.includes(plantId)) {
        favorites.push(plantId);
        saveFavorites(favorites);
    }
    return favorites;
}

/**
 * Elimină un ID de plantă din favorite.
 * @param {number} plantId - ID-ul plantei.
 */
export function removeFavorite(plantId) {
    let favorites = getFavorites();
    favorites = favorites.filter(id => id !== plantId);
    saveFavorites(favorites);
    return favorites;
}