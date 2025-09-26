// src/js/features/faq/services/faqService.js
import { DATA_FILES } from '../../../shared/utils/constants.js';
import { fetchWithRetries } from '../../../shared/services/apiService.js';

export async function loadFaqData() {
    const faqData = await fetchWithRetries(DATA_FILES.FAQ);
    if (!faqData || typeof faqData !== 'object' || Object.keys(faqData).length === 0) {
        throw new Error(`Datele din "${DATA_FILES.FAQ}" nu au formatul așteptat.`);
    }
    return faqData;
}