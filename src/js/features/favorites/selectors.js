// src/js/features/favorites/selectors.js

/**
 * Returnează un array cu ID-urile plantelor favorite.
 * @param {object} state - Starea globală a aplicației.
 * @returns {number[]}
 */
export const getFavoriteIds = (state) => state.favorites?.ids || [];

/**
 * Verifică dacă filtrul de favorite este activ.
 * @param {object} state - Starea globală a aplicației.
 * @returns {boolean}
 */
export const isFavoritesFilterActive = (state) => state.favorites?.filterActive || false;