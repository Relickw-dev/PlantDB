// src/js/features/plants/plantsReducer.js
import { actionTypes } from '../../store/actionTypes.js';
import { DEFAULT_STATE, SORT_KEYS } from '../../utils/constants.js';

const initialState = DEFAULT_STATE.plants;

export function plantsReducer(state = initialState, action) {
    switch (action.type) {
        case actionTypes.SET_IS_LOADING:
            return { ...state, isLoading: action.payload };

        case actionTypes.SET_INITIAL_DATA:
            return {
                ...state,
                all: action.payload.plants,
                allUniqueTags: action.payload.uniqueTags,
                isLoading: false,
            };

        case actionTypes.SET_QUERY:
            return { ...state, query: action.payload };
        
        case actionTypes.SET_SORT_ORDER:
            return { ...state, sortOrder: action.payload };

        case actionTypes.SET_ACTIVE_TAGS:
            return { ...state, activeTags: action.payload };
            
        case actionTypes.RESET_FILTERS:
            return {
                ...state,
                query: "",
                sortOrder: SORT_KEYS.AZ,
                activeTags: [],
            };
        
        case actionTypes.SET_MODAL_PLANT:
            return { ...state, modalPlant: action.payload, isOpen: true };

        case actionTypes.CLOSE_MODAL:
            return { ...state, modalPlant: null, isOpen: false };

        case actionTypes.SET_COPY_STATUS:
            return { ...state, copyStatus: action.payload };

        default:
            return state;
    }
}