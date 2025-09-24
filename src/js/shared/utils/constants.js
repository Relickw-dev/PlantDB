/**
 * Centralizează toate constantele și "magic strings" din aplicație
 * pentru a crește robustețea și a facilita mentenanța.
 */

// Tema aplicației
export const THEME = Object.freeze({
    LIGHT: 'light',
    DARK: 'dark',
    STORAGE_KEY: 'theme',
    CSS_CLASS_LIGHT: 'light',
    SWITCH_CLASS_ON: 'on',
});

// Cheile pentru strategiile de sortare
export const SORT_KEYS = Object.freeze ({
    AZ: 'az',
    ZA: 'za',
    TOX_ASC: 'tox-asc',
    TOX_DESC: 'tox-desc',
    DIFF_ASC: 'diff-asc',
    DIFF_DESC: 'diff-desc',
    AIR_ASC: 'air-asc',
    AIR_DESC: 'air-desc',
    GROWTH_ASC: 'growth-asc',
    GROWTH_DESC: 'growth-desc',
});

// Numele evenimentelor custom emise de componentele UI
export const CUSTOM_EVENTS = Object.freeze ({
    PLANT_SELECTED: 'plant-selected',
    TAG_SELECTED: 'tag-selected',
    CLOSE_REQUEST: 'close-request',
    NAVIGATE_REQUEST: 'navigate-request',
    COPY_REQUEST: 'copy-request',
    SHARE_REQUEST: 'share-request',
});

// Parametrii folosiți în URL
export const URL_PARAMS = Object.freeze ({
    QUERY: 'search',
    SORT: 'sort',
    TAG: 'tag',
});

// Prefixele pentru hash-urile din URL
export const HASH_PREFIXES = Object.freeze ({
    PLANT: '#plant-',
    FAQ: '#faq',
});

// Căile către fișierele de date
export const DATA_FILES = Object.freeze ({
    PLANTS: 'assets/data/plants.json',
    FAQ: 'assets/data/faq.json',
});

// Tipurile de notificări
export const NOTIFICATION_TYPES = Object.freeze ({
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
});

// Cuvinte cheie pentru căutarea "pet-friendly"
export const PET_KEYWORDS = Object.freeze (['pisica', 'pisici', 'caine', 'caini', 'animal', 'animale', 'pet']);


export const TIMINGS = Object.freeze ({
    SEARCH_DEBOUNCE: 300,
    INTRO_DELAY: 1200,
    COPY_RESET_DELAY: 300,
    DEBOUNCE_DEFAULT: 300,
    THROTTLE_DEFAULT: 300,
    GRID_ANIMATION_DURATION: 200,
});

export const DEFAULTS = Object.freeze ({
    NOTIFICATION_DURATION: 4000,
    NOTIFICATION_TYPE: NOTIFICATION_TYPES.INFO, 
    NOTIFICATION_POSITION: 'bottom-right',
    UNIQUE_ID_PREFIX: 'id-',
});

export const NAVIGATION = Object.freeze ({
    NEXT: 'next',
    PREV: 'prev',
});

export const COPY_STATUS = Object.freeze ({
    IDLE: 'idle',
    SUCCESS: 'success',
    ERROR: 'error',
});

export const UI = Object.freeze ({
    EMPTY_PLACEHOLDER: '—',
});

export const CSS_CLASSES = Object.freeze ({
    SHOW: 'show',
    LOADED: 'loaded',
    // etc.
});

// Puncte de întrerupere (breakpoints) pentru design-ul responsiv
export const BREAKPOINTS = Object.freeze ({
    MOBILE: 768,
});

export const FAB_ACTIONS = Object.freeze ({
    TOGGLE_THEME: 'toggle-theme',
    SHOW_FAQ: 'show-faq',
});


// Definește structura și valorile implicite ale stării aplicației.
export const DEFAULT_STATE = Object.freeze({
    plants: {
        all: [],
        allUniqueTags: [],
        isLoading: true,
        query: "",
        sortOrder: 'az',
        activeTags: [],
        modalPlant: null,
        copyStatus: 'idle',
    },
    favorites: {
        ids: [],
        filterActive: false,
    },
    faq: {
        isOpen: false,
        data: null,
        loadFailed: false,
    }
});

export const TOXICITY_MAP = Object.freeze({
    0: { icon: "✅", text: "Non-toxic", class: "safe" },
    1: { icon: "⚠️", text: "Ușor toxic", class: "low-risk" },
    2: { icon: "⛔", text: "Toxic", class: "toxic" },
    3: { icon: "☠️", text: "Foarte toxic", class: "very-toxic" },
    default: { icon: "❔", text: "Necunoscut", class: "unknown" },
});

export const DIFFICULTY_LEVELS = Object.freeze([
    { key: 'EASY', label: 'ușoară', value: 1, class: 'easy' },
    { key: 'MEDIUM', label: 'medie', value: 2, class: 'medium' },
    { key: 'HARD', label: 'grea', value: 3, class: 'hard' }
]);