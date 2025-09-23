// src/js/core/featureLoader.js

// Lista centrală a tuturor modulelor pe care aplicația le poate avea.
// Pentru a dezactiva un feature, îl poți comenta sau șterge de aici.
const FEATURE_NAMES = [
    'plants',
    'favorites',
    'faq',
    'theme'
];

/**
 * Încarcă dinamic modulele definite în FEATURE_NAMES.
 * Dacă un modul nu poate fi încărcat, va afișa un avertisment și va continua.
 * @returns {Promise<Object[]>} O listă cu modulele încărcate cu succes.
 */
export async function loadFeatures() {
    const loadedFeatures = [];

    for (const name of FEATURE_NAMES) {
        try {
            // Folosim import() dinamic, care returnează o promisiune
            const module = await import(`../features/${name}/index.js`);
            if (module.default) {
                loadedFeatures.push(module.default);
                console.log(`✅ Modulul '${name}' a fost încărcat.`);
            }
        } catch (error) {
            console.warn(
                `[Feature Loader] Modulul '${name}' nu a putut fi încărcat. Funcționalitatea va fi indisponibilă.`,
                error
            );
        }
    }
    
    return loadedFeatures;
}