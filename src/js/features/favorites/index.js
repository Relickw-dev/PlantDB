// src/js/features/favorites/index.js
import { favoritesReducer } from './favoritesReducer.js';
import * as favoriteActions from './favoritesActions.js';

export default {
    name: 'favorites',
    reducer: favoritesReducer,
    bindEvents: (dom, store) => {
        dom.showFavoritesBtn.addEventListener('click', () => store.dispatch(favoriteActions.toggleFavoritesFilter()));
        document.body.addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('.favorite-btn[data-plant-id]');
            if (favoriteBtn) {
                e.stopPropagation();
                const plantId = parseInt(favoriteBtn.dataset.plantId, 10);
                if (!isNaN(plantId)) {
                    store.dispatch(favoriteActions.toggleFavorite(plantId));
                }
            }
        });
    },
    syncUI: ({ dom, state, oldState }) => {
        const currentActive = state.favorites.filterActive;
        const oldActive = (oldState.favorites || {}).filterActive;

        if (currentActive !== oldActive) {
            dom.showFavoritesBtn.classList.toggle('active', currentActive);
        }
    }
};