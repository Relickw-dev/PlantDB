import { getSortedAndFilteredPlants as originalGetSortedAndFilteredPlants } from './plantLogic.js';
import memoizeOne from 'https://cdn.jsdelivr.net/npm/memoize-one@5.2.1/dist/memoize-one.esm.js';

// Folosim funcția globală `memoizeOne` încărcată prin tag-ul <script>
const memoize = window.memoizeOne;

/**
 * O versiune "memoizată" a funcției getSortedAndFilteredPlants.
 * Va re-executa logica de sortare/filtrare doar dacă unul dintre
 * argumente (plants, query, activeTags, sortOrder) este diferit
 * față de apelul anterior.
 */
export const getMemoizedSortedAndFilteredPlants = memoize(originalGetSortedAndFilteredPlants);