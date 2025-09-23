// src/js/features/plants/plantsReducer.js
import { actionTypes } from '../../store/actionTypes.js';
import { DEFAULT_STATE, SORT_KEYS } from '../../utils/constants.js';

// definim starea inițială doar pentru acest "slice"
const initialState = {
    all: [],
    alluniquetags: [],
    isLoading: true,
    query: "",
    sortOrder: SORT_KEYS.az,
    activetags: [],
    modalplant: null,
    copystatus: 'idle',
};

export function plantsReducer(state = initialState, action) {
    switch (action.type) {
        case actionTypes.set_is_loading:
            return { ...state, isLoading: action.payload };

        case actionTypes.set_initial_data:
            return {
                ...state,
                all: action.payload.plants,
                alluniquetags: action.payload.uniquetags,
                isloading: false,
            };

        case actionTypes.set_query:
            return { ...state, query: action.payload };
        
        case actionTypes.set_sort_order:
            return { ...state, sortorder: action.payload };

        case actionTypes.set_active_tags:
            return { ...state, activetags: action.payload };
            
        case actionTypes.reset_filters:
            return {
                ...state,
                query: "",
                sortorder: SORT_KEYS.az,
                activetags: [],
            };
        
        case actionTypes.set_modal_plant:
            return { ...state, modalplant: action.payload };

        case actionTypes.close_modal:
            return { ...state, modalplant: null };

        case actionTypes.set_copy_status:
            return { ...state, copystatus: action.payload };

        default:
            return state;
    }
}