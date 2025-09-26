// src/js/app/bootstrap.js

import { siteConfig } from './siteConfig.js';
import { bootstrapFromConfig } from '../shared/core/genericBootstrap.js';

/**
 * Punctul de intrare pentru inițializarea aplicației PlantDB.
 * Această funcție combină configurația specifică a site-ului cu
 * logica generică de bootstrap pentru a pregăti aplicația.
 *
 * @returns {{dom: Object, components: Object}} Un obiect care conține
 * referințele către elementele DOM esențiale și instanțele componentelor UI.
 */
export function bootstrapApp() {
    // Apelează funcția generică de bootstrap, transmițându-i
    // configurația specifică importată din `siteConfig.js`.
    return bootstrapFromConfig(siteConfig);
}