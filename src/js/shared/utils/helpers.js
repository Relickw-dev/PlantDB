import { TIMINGS, DEFAULTS } from './constants.js';

// --- Utilitare DOM ---

/**
 * Creează un element DOM cu opțiuni de configurare.
 * O metodă sigură și declarativă pentru a construi interfețe.
 * @param {string} tag - Tag-ul HTML al elementului (ex: 'div', 'img').
 * @param {object} [options] - Opțiuni pentru configurarea elementului.
 * @param {string} [options.className] - Clasa/clasele CSS.
 * @param {string} [options.text] - Conținutul text (folosește textContent).
 * @param {string} [options.html] - Conținutul HTML (de folosit cu precauție, folosește innerHTML).
 * @param {object} [options.attrs] - Atributele elementului (ex: { src: 'img.png', "data-id": 12 }).
 * @param {HTMLElement[]} [options.children] - Un array de elemente copil de adăugat.
 * @returns {HTMLElement} Elementul DOM creat.
 */
export function createElement(tag, options = {}) {
    const el = document.createElement(tag);

    // Destructurăm opțiunile pentru un cod mai curat
    const { className, text, html, attrs, children } = options;

    if (className) el.className = className;
    if (text) el.textContent = text;
    if (html) el.innerHTML = html; // Păstrat pentru cazuri speciale

    if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
            el.setAttribute(key, value);
        }
    }

    if (children && children.length > 0) {
        // Folosim metoda 'append' care poate adăuga mai mulți copii simultan
        el.append(...children);
    }

    return el;
}


// --- Utilitare pentru Controlul Execuției ---

/**
 * Limitează executarea unei funcții, asigurând că este apelată doar după 
 * ce a trecut un anumit timp de la ultima invocare (debounce).
 * Ideal pentru input-uri de căutare.
 * @param {Function} func - Funcția de apelat.
 * @param {number} [delay=TIMINGS.DEBOUNCE_DEFAULT] - Timpul de așteptare în milisecunde.
 * @returns {Function} Funcția "debounced".
 */
export function debounce(func, delay = TIMINGS.DEBOUNCE_DEFAULT) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Asigură că o funcție este executată maxim o dată într-un interval de timp specificat (throttle).
 * Ideal pentru evenimente care se declanșează des (ex: scroll, resize).
 * @param {Function} func - Funcția de apelat.
 * @param {number} [limit=TIMINGS.THROTTLE_DEFAULT] - Intervalul de timp în milisecunde.
 * @returns {Function} Funcția "throttled".
 */
export function throttle(func, limit = TIMINGS.THROTTLE_DEFAULT) {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Creează o pauză într-o funcție asincronă.
 * @param {number} ms - Durata pauzei în milisecunde.
 * @returns {Promise<void>}
 */
export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


// --- Utilitare Generale ---

/**
 * Restrânge o valoare numerică între un minim și un maxim.
 * @param {number} value - Valoarea de restrâns.
 * @param {number} min - Limita inferioară.
 * @param {number} max - Limita superioară.
 * @returns {number} Valoarea restrânsă.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

/**
 * Verifică dacă o valoare este considerată "goală" (null, undefined, array/string/obiect gol).
 * @param {*} value - Valoarea de verificat.
 * @returns {boolean}
 */
export function isEmpty(value) {
    if (value == null) return true;
    if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
    // NOU: Suport pentru Map și Set
    if (value instanceof Map || value instanceof Set) return value.size === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * O funcție helper pentru a crea și trimite un eveniment custom.
 * Centralizează logica de dispatch pentru a evita repetiția.
 * @param {HTMLElement} element - Elementul DOM care va trimite evenimentul.
 * @param {string} eventName - Numele evenimentului (ex: 'plant-selected').
 * @param {object} [detail={}] - Datele de trimis odată cu evenimentul.
 */
export function dispatchEvent(element, eventName, detail = {}) {
    const event = new CustomEvent(eventName, { 
        detail, 
        bubbles: true 
    });
    element.dispatchEvent(event);
}

/**
 * Formatează o valoare pentru afișare, oferind o valoare de rezervă dacă este goală.
 * @param {*} value - Valoarea de verificat.
 * @param {string} [fallback='—'] - Textul de afișat dacă valoarea este goală.
 * @returns {string} Valoarea formatată.
 */
export function formatValue(value, fallback = '—') {
    return value || fallback;
}