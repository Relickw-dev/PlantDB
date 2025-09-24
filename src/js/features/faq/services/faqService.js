// src/js/features/faq/services/faqService.js
import { DATA_FILES } from '../../../shared/utils/constants.js';

// Am păstrat funcția de fetch generică, dar ai putea să o muți într-un
// fișier partajat dacă o folosești și în altă parte.
async function fetchWithRetries(url, options = {}) {
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
                throw new Error(`Eroare HTTP ${response.status} la încărcarea fișierului: ${url}`);
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

/**
 * Încarcă datele pentru secțiunea FAQ.
 * @returns {Promise<object>} Obiectul cu datele FAQ.
 */
export async function loadFaqData() {
    const faqData = await fetchWithRetries(DATA_FILES.FAQ);
    if (!faqData || typeof faqData !== 'object' || Object.keys(faqData).length === 0) {
        throw new Error(`Datele din "${DATA_FILES.FAQ}" nu au formatul așteptat.`);
    }
    return faqData;
}