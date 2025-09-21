// Cheia unică folosită pentru a stoca favoritele în localStorage.
const FAVORITES_KEY = 'plantAppFavorites';

/**
 * Preia ID-urile plantelor favorite din localStorage.
 * Include un mecanism de validare și auto-corectare pentru datele corupte.
 * @returns {number[]} Un array de ID-uri numerice.
 */
export function getFavorites() {
    const favoritesJSON = localStorage.getItem(FAVORITES_KEY);

    // Dacă nu există nicio intrare, returnăm un array gol.
    if (!favoritesJSON) {
        return [];
    }

    try {
        const parsedFavorites = JSON.parse(favoritesJSON);

        // --- PATCH APLICAT: Validare suplimentară a tipului de date ---
        // Verificăm dacă datele parsate sunt un array. Acest lucru previne
        // erorile dacă localStorage conține un JSON valid, dar care nu este un array.
        if (!Array.isArray(parsedFavorites)) {
            throw new Error("Datele favoritelor nu sunt stocate ca un array.");
        }

        // Ne asigurăm că toate elementele din array sunt numere.
        return parsedFavorites.filter(id => typeof id === 'number');

    } catch (error) {
        console.error("Eroare la parsarea sau validarea favoritelor din localStorage:", error);

        // --- PATCH APLICAT: Auto-corectare ---
        // Dacă datele sunt corupte sau invalide, le ștergem pentru a preveni erori viitoare.
        localStorage.removeItem(FAVORITES_KEY);

        // Returnăm un array gol ca fallback sigur.
        return [];
    }
}

/**
 * Salvează un array de ID-uri de favorite în localStorage.
 * @param {number[]} favoriteIds - Array-ul de ID-uri de salvat.
 */
function saveFavorites(favoriteIds) {
    // Asigurăm că salvăm întotdeauna un array valid.
    if (Array.isArray(favoriteIds)) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
    } else {
        console.error("Încercare de a salva date invalide pentru favorite. Salvarea a fost anulată.");
    }
}

/**
 * Adaugă un ID de plantă la lista de favorite, dacă nu există deja.
 * @param {number} plantId - ID-ul plantei de adăugat.
 * @returns {number[]} Noul array de favorite.
 */
export function addFavorite(plantId) {
    const favorites = getFavorites();
    if (!favorites.includes(plantId)) {
        const newFavorites = [...favorites, plantId];
        saveFavorites(newFavorites);
        return newFavorites;
    }
    return favorites;
}

/**
 * Elimină un ID de plantă din lista de favorite.
 * @param {number} plantId - ID-ul plantei de eliminat.
 * @returns {number[]} Noul array de favorite.
 */
export function removeFavorite(plantId) {
    let favorites = getFavorites();
    const newFavorites = favorites.filter(id => id !== plantId);
    saveFavorites(newFavorites);
    return newFavorites;
}