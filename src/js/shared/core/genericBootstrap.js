// src/js/shared/core/genericBootstrap.js

/**
 * Găsește și validează elementele DOM pe baza unei hărți de selectori.
 * @param {object} selectors - Obiectul cu selectorii DOM (ex: { grid: '#grid' }).
 * @returns {object} Un obiect cu referințe către elementele DOM găsite.
 * @private
 */
function queryDOMElements(selectors) {
    const elements = {};
    for (const key in selectors) {
        const el = document.querySelector(selectors[key]);
        if (!el) {
            // Aruncă o eroare dacă un element esențial nu este găsit,
            // pentru a opri execuția și a semnala problema.
            throw new Error(`Bootstrap Error: Elementul esențial nu a fost găsit folosind selectorul '${selectors[key]}' pentru cheia '${key}'.`);
        }
        elements[key] = el;
    }
    return elements;
}

/**
 * Inițializează componentele UI pe baza unei liste de configurare și a elementelor DOM.
 * @param {Array<object>} componentConfigs - Lista de obiecte de configurare pentru componente.
 * @param {object} domElements - Obiectul cu referințe către elementele DOM.
 * @returns {object} Un obiect cu instanțele componentelor create.
 * @private
 */
function initComponents(componentConfigs, domElements) {
    const components = {};
    for (const config of componentConfigs) {
        // Obține elementul container pe baza cheii `selector` din configurație.
        const containerElement = config.selector ? domElements[config.selector] : undefined;
        
        // Instanțiază clasa componentei, transmițând elementul container dacă este necesar.
        components[config.name] = new config.class(containerElement);
    }
    return components;
}

/**
 * Punctul de intrare generic pentru inițializarea aplicației dintr-un obiect de configurare.
 * @param {object} config - Obiectul de configurare a site-ului (ex: siteConfig).
 * @returns {{dom: object, components: object}} Un obiect conținând referințele DOM și instanțele componentelor.
 */
export function bootstrapFromConfig(config) {
    if (!config || !config.domSelectors || !config.components) {
        throw new Error("Bootstrap Error: Obiectul de configurare este invalid sau incomplet.");
    }
    
    const dom = queryDOMElements(config.domSelectors);
    const components = initComponents(config.components, dom);
    
    return { dom, components };
}