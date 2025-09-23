// src/js/features/plants/plantsReducer.js
import { actiontypes } from '../../store/actionTypes.js';
import { default_state, sort_keys } from '../../utils/constants.js';

// definim starea inițială doar pentru acest "slice"
const initialstate = {
    all: [],
    alluniquetags: [],
    isloading: true,
    query: "",
    sortorder: sort_keys.az,
    activetags: [],
    modalplant: null,
    copystatus: 'idle',
};

export function plantsreducer(state = initialstate, action) {
    switch (action.type) {
        case actiontypes.set_is_loading:
            return { ...state, isloading: action.payload };

        case actiontypes.set_initial_data:
            return {
                ...state,
                all: action.payload.plants,
                alluniquetags: action.payload.uniquetags,
                isloading: false,
            };

        case actiontypes.set_query:
            return { ...state, query: action.payload };
        
        case actiontypes.set_sort_order:
            return { ...state, sortorder: action.payload };

        case actiontypes.set_active_tags:
            return { ...state, activetags: action.payload };
            
        case actiontypes.reset_filters:
            return {
                ...state,
                query: "",
                sortorder: sort_keys.az,
                activetags: [],
            };
        
        case actiontypes.set_modal_plant:
            return { ...state, modalplant: action.payload };

        case actiontypes.close_modal:
            return { ...state, modalplant: null };

        case actiontypes.set_copy_status:
            return { ...state, copystatus: action.payload };

        default:
            return state;
    }
}