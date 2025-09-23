import { THEME } from '../utils/constants.js';

/**
 * Aplică o temă (light/dark) pe document și o salvează în localStorage.
 * @param {string} mode - Tema de aplicat ('light' sau 'dark').
 */
export function applyTheme(mode) {
    document.documentElement.classList.toggle(THEME.CSS_CLASS_LIGHT, mode === THEME.LIGHT);
    localStorage.setItem(THEME.STORAGE_KEY, mode);
}

/**
 * Setează tema inițială la încărcarea aplicației DOAR dacă există o preferință
 * salvată de utilizator. Altfel, lasă CSS-ul să decidă pe baza `prefers-color-scheme`.
 */
export function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME.STORAGE_KEY);

    // Corecția finală: Aplicăm tema doar dacă a fost salvată anterior.
    // Dacă `savedTheme` este null (la prima vizită), funcția nu face nimic,
    // permițând regulii `@media (prefers-color-scheme: light)` din CSS
    // să funcționeze 100% natural.
    if (savedTheme) {
        applyTheme(savedTheme);
    }
}