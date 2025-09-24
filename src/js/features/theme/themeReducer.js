// src/js/features/theme/themeReducer.js
import { actionTypes } from '../../shared/store/actionTypes.js';
import { THEME } from '../../shared/utils/constants.js';

const initialState = {
    current: localStorage.getItem(THEME.STORAGE_KEY) || THEME.DARK,
};

export function themeReducer(state = initialState, action) {
    switch (action.type) {
        case actionTypes.TOGGLE_THEME:
            const newTheme = state.current === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
            return { ...state, current: newTheme };
        default:
            return state;
    }
}