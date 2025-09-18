import { THEME } from '../utils/constants.js'; // Presupunând că ai actualizat constants.js

/**
 * Aplică o temă (light/dark) pe document și actualizează starea vizuală a comutatorului.
 * @param {string} mode - Tema de aplicat ('light' sau 'dark').
 * @param {HTMLElement} themeSwitch - Elementul DOM al comutatorului.
 */
export function applyTheme(mode, themeSwitch) {
    document.documentElement.classList.toggle(THEME.CSS_CLASS_LIGHT, mode === THEME.LIGHT);
    localStorage.setItem(THEME.STORAGE_KEY, mode);
    
    if (themeSwitch) {
        themeSwitch.setAttribute("aria-checked", mode === THEME.LIGHT);
        themeSwitch.classList.toggle(THEME.SWITCH_CLASS_ON, mode === THEME.LIGHT);
    }
}

/**
 * Inițializează logica pentru comutatorul de temă.
 * @param {HTMLElement} themeSwitch - Elementul DOM care acționează ca și comutator.
 */
export function setupThemeToggle(themeSwitch) {
    if (!themeSwitch) return;

    const savedTheme = localStorage.getItem(THEME.STORAGE_KEY);
    const preferredTheme = window.matchMedia(`(prefers-color-scheme: ${THEME.LIGHT})`).matches ? THEME.LIGHT : THEME.DARK;
    
    const initialTheme = savedTheme || preferredTheme;
    applyTheme(initialTheme, themeSwitch);

    themeSwitch.addEventListener("click", () => {
        const newTheme = document.documentElement.classList.contains(THEME.CSS_CLASS_LIGHT) ? THEME.DARK : THEME.LIGHT;
        applyTheme(newTheme, themeSwitch);
    });
}