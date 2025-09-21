import { getSortedAndFilteredPlants as originalGetSortedAndFilteredPlants } from './plantLogic.js';
// Nu mai importăm memoizeOne de pe CDN, presupunem că este disponibil global
// conform fișierului Index.html.

const memoize = window.memoizeOne;

/**
 * O versiune "memoizată" a funcției getSortedAndFilteredPlants.
 * Va re-executa logica de sortare/filtrare doar dacă unul dintre
 * argumente (inclusiv cele pentru favorite) este diferit față de apelul anterior.
 */
export const getMemoizedSortedAndFilteredPlants = memoize(originalGetSortedAndFilteredPlants);