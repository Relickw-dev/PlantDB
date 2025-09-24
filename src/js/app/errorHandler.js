// src/js/core/errorHandler.js

import { showNotification } from '../shared/components/NotificationService.js';

// --- CLASE DE ERORI PERSONALIZATE ---

/**
 * Reprezintă o eroare care împiedică aplicația să funcționeze corect.
 * Acestea sunt erori neașteptate (ex: eșuarea la încărcarea datelor critice).
 */
export class CriticalError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CriticalError';
    }
}

/**
 * Reprezintă o eroare operațională, care nu oprește aplicația.
 * Acestea sunt erori previzibile (ex: eșuarea la copierea unui text).
 */
export class OperationalError extends Error {
    constructor(message) {
        super(message);
        this.name = 'OperationalError';
    }
}


// --- FUNCȚIA CENTRALĂ DE GESTIONARE A ERORILOR ---

/**
 * Gestionează erorile într-un mod centralizat.
 * Loghează eroarea și afișează o notificare corespunzătoare.
 * @param {Error} error - Obiectul erorii.
 * @param {string} [context='necunoscut'] - Contextul în care a apărut eroarea.
 */
export function handleError(error, context = 'necunoscut') {
    console.error(`[ErrorHandler] Eroare în contextul "${context}":`, error);

    const isCritical = error instanceof CriticalError;
    const userMessage = error.message || 'A apărut o eroare neașteptată.';

    showNotification(
        `Eroare la ${context}: ${userMessage}`,
        {
            type: 'error',
            duration: isCritical ? 0 : 5000, // Notificările critice sunt persistente
            dismissible: true,
        }
    );
}


// --- INIȚIALIZAREA LISTENER-ILOR GLOBALI ---

/**
 * Inițializează mecanismele globale de capturare a erorilor.
 * Trebuie apelat o singură dată la pornirea aplicației.
 */
export function initializeGlobalErrorHandler() {
    // Gestionează erorile de script neprinse
    window.onerror = (message, source, lineno, colno, error) => {
        handleError(error || new Error(message), 'global (onerror)');
        return true; // Previne afișarea erorii în consola browser-ului
    };

    // Gestionează promisiunile respinse neprinse
    window.onunhandledrejection = (event) => {
        handleError(event.reason, 'promisiune neprinsă (onunhandledrejection)');
        event.preventDefault(); // Previne logarea suplimentară a erorii
    };

    console.log("✅ Global Error Handler a fost inițializat.");
}