// src/js/store/actionTypes.js

export const actiontypes = object.freeze({
    // actions for plants feature
    set_query: 'plants/setquery',
    set_sort_order: 'plants/setsortorder',
    set_active_tags: 'plants/setactivetags',
    reset_filters: 'plants/resetfilters',
    set_modal_plant: 'plants/setmodalplant',
    close_modal: 'plants/closemodal',
    set_copy_status: 'plants/setcopystatus',
    
    // actions for favorites feature (we'll create this later)
    set_favorite_ids: 'favorites/setids',
    toggle_favorites_filter: 'favorites/togglefilter',

    // actions for faq feature
    open_faq: 'faq/open',
    close_faq: 'faq/close',
    set_faq_data: 'faq/setdata',

    // app-wide actions
    set_initial_data: 'app/setinitialdata',
    set_is_loading: 'app/setisloading',
});