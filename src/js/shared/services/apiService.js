// src/js/shared/services/apiService.js
/**
 * Un wrapper robust pentru API-ul fetch, care include retries și timeout.
 * @param {string} url - URL-ul pentru fetch.
 * @param {object} [options={}] - Opțiunile fetch-ului.
 * @returns {Promise<object>} Răspunsul JSON.
 */
export async function fetchWithRetries(url, options = {}) {
    const { retries = 2, timeout = 8000, ...fetchOptions } = options;

    for (let i = 0; i <= retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = new Error(`Eroare HTTP ${response.status} la încărcarea datelor: ${url}`);
                error.status = response.status;
                throw error;
            }
            
            const text = await response.text();
            if (!text) {
                throw new Error(`Fișierul JSON de la ${url} este gol.`);
            }
            return JSON.parse(text);

        } catch (error) {
            if (i === retries) {
                throw error;
            }
            await new Promise(res => setTimeout(res, 500 * (i + 1)));
        }
    }
}