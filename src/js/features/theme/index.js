// src/js/features/theme/index.js
import { themeReducer } from './themeReducer.js';
import { toggleTheme } from './themeActions.js';
import { FAB_ACTIONS } from '../../shared/utils/constants.js';
import { applyTheme } from './services/themeService.js';

export default {
    name: 'theme',
    reducer: themeReducer,
    bindEvents: (dom, store) => {
        dom.fabContainer.addEventListener('fab-action', (e) => {
            if (e.detail.action === FAB_ACTIONS.TOGGLE_THEME) {
                store.dispatch(toggleTheme());
            }
        });
    },
    syncUI: ({ state, oldState }) => {
        const currentTheme = state.theme.current;
        const oldTheme = (oldState.theme || {}).current;

        if (currentTheme !== oldTheme) {
            applyTheme(currentTheme);
        }
    }
};