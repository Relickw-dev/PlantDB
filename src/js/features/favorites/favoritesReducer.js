// src/js/features/favorites/favoritesReducer.js
import { actiontypes } from '../../store/actionTypes.js';

const initialState = {
    ids: [],
    filterActive: false,
};

export function favoritesReducer(state = initialState, action) {
    switch (action.type) {
        case actionTypes.SET_FAVORITE_IDS:
            return {
                ...state,
                ids: action.payload,
            };

        case actionTypes.TOGGLE_FAVORITES_FILTER:
            return {
                ...state,
                filterActive: !state.filterActive,
            };

        default:
            return state;
    }
}