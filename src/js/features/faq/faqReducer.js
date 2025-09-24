// src/js/features/faq/faqReducer.js
import { actionTypes} from '../../shared/store/actionTypes.js';

const initialState = {
    isOpen: false,
    data: null,
    loadFailed: false,
};

export function faqReducer(state = initialState, action) {
    switch (action.type) {
        case actionTypes.OPEN_FAQ:
            return { ...state, isOpen: true };

        case actionTypes.CLOSE_FAQ:
            return { ...state, isOpen: false };

        case actionTypes.SET_FAQ_DATA:
            return { ...state, data: action.payload, loadFailed: false };
        
        case actionTypes.SET_FAQ_ERROR:
            return { ...state, loadFailed: true };

        default:
            return state;
    }
}