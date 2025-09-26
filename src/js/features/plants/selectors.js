// src/js/features/plants/selectors.js

/**
 * Returnează toate plantele procesate.
 * @param {object} state - Starea globală a aplicației.
 * @returns {Array<object>}
 */
export const getAllPlants = (state) => state.plants?.all || [];

/**
 * Returnează interogarea de căutare curentă.
 * @param {object} state - Starea globală a aplicației.
 * @returns {string}
 */
export const getQuery = (state) => state.plants?.query || '';

/**
 * Returnează lista de tag-uri active.
 * @param {object} state - Starea globală a aplicației.
 * @returns {string[]}
 */
export const getActiveTags = (state) => state.plants?.activeTags || [];

/**
 * Returnează ordinea de sortare curentă.
 * @param {object} state - Starea globală a aplicației.
 * @returns {string}
 */
export const getSortOrder = (state) => state.plants?.sortOrder || '';

/**
 * Returnează starea modalului curent al plantei.
 * @param {object} state - Starea globală a aplicației.
 * @returns {object|null}
 */
export const getModalPlant = (state) => state.plants?.modalPlant || null;

/**
 * Returnează starea de copiere în clipboard.
 * @param {object} state - Starea globală a aplicației.
 * @returns {string}
 */
export const getCopyStatus = (state) => state.plants?.copyStatus || 'idle';

/**
 * Returnează toate tag-urile unice disponibile.
 * @param {object} state - Starea globală a aplicației.
 * @returns {string[]}
 */
export const getAllUniqueTags = (state) => state.plants?.allUniqueTags || [];

/**
 * Verifică dacă grila este în starea de încărcare.
 * @param {object} state - Starea globală a aplicației.
 * @returns {boolean}
 */
export const isPlantsLoading = (state) => state.plants?.isLoading || false;