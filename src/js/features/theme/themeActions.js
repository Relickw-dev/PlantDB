// src/js/features/theme/themeActions.js
import store from '../../store/index.js';
import { actionTypes } from '../../store/actionTypes.js';

export const toggleTheme = () => {
    store.dispatch({ type: actionTypes.TOGGLE_THEME });
};