// src/js/features/faq/faqActions.js
import { actionTypes } from '../../shared/store/actionTypes.js';
import { loadFaqData } from './services/faqService.js';
import { handleError, CriticalError } from '../../app/errorHandler.js'; // Adaugă CriticalError
import { showNotification } from '../../shared/components/NotificationService.js';

export const closeFaq = () => ({ type: actionTypes.CLOSE_FAQ });

export const openFaq = () => async (dispatch, getState) => {
    const { faq } = getState();

    if (faq.loadFailed) {
        showNotification("Conținutul FAQ nu este disponibil.", { type: "error" });
        return;
    }

    if (faq.data) {
        dispatch({ type: actionTypes.OPEN_FAQ });
        return;
    }

    try {
        const faqData = await loadFaqData();
        dispatch({ type: actionTypes.SET_FAQ_DATA, payload: faqData });
        dispatch({ type: actionTypes.OPEN_FAQ });
    } catch (err) {
        // Aici eroarea de încărcare a datelor este considerată critică
        handleError(new CriticalError(`Încărcarea datelor FAQ a eșuat.`), "încărcarea datelor FAQ");
        dispatch({ type: actionTypes.SET_FAQ_ERROR });
    }
};