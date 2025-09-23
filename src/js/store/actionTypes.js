// src/js/store/actionTypes.js

export const actionTypes = Object.freeze({
    // Actions for plants feature
    SET_QUERY: 'plants/setQuery',
    SET_SORT_ORDER: 'plants/setSortOrder',
    SET_ACTIVE_TAGS: 'plants/setActiveTags',
    RESET_FILTERS: 'plants/resetFilters',
    SET_MODAL_PLANT: 'plants/setModalPlant',
    CLOSE_MODAL: 'plants/closeModal',
    SET_COPY_STATUS: 'plants/setCopyStatus',
    
    // Actions for favorites feature
    SET_FAVORITE_IDS: 'favorites/setIds',
    TOGGLE_FAVORITES_FILTER: 'favorites/toggleFilter',

    // Actions for faq feature
    OPEN_FAQ: 'faq/open',
    CLOSE_FAQ: 'faq/close',
    SET_FAQ_DATA: 'faq/setData',
    SET_FAQ_ERROR: 'faq/setError',

    // App-wide actions
    SET_INITIAL_DATA: 'app/setInitialData',
    SET_IS_LOADING: 'app/setIsLoading',
});