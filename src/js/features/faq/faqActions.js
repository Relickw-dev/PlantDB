// src/js/features/faq/faqActions.js
import { actionTypes } from '../../store/actionTypes.js';
import { loadFaqData } from '../../services/plantService.js';
import { handleError } from '../../core/errorHandler.js';
import { showNotification } from '../../components/NotificationService.js';

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
        handleError(err, "încărcarea datelor FAQ");
        dispatch({ type: actionTypes.SET_FAQ_ERROR });
    }
};