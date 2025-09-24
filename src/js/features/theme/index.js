// src/js/features/theme/index.js
import { themeReducer } from './themeReducer.js';
import { toggleTheme } from './themeActions.js';
import { FAB_ACTIONS } from '../../shared/utils/constants.js';

export default {
    name: 'theme',
    reducer: themeReducer,
    bindEvents: (dom, store) => {
        // Ascultă evenimentul de pe meniul FAB
        dom.fabContainer.addEventListener('fab-action', (e) => {
            if (e.detail.action === FAB_ACTIONS.TOGGLE_THEME) {
                store.dispatch(toggleTheme());
            }
        });
    }
};