// src/js/features/faq/index.js
import { faqReducer } from './faqReducer.js';
import * as faqActions from './faqActions.js';
import { FaqModal } from './components/FaqModal.js';
import { CUSTOM_EVENTS, FAB_ACTIONS } from '../../shared/utils/constants.js';

// Contractul pe care îl expune acest feature
export default {
    // Numele stării pe care o va gestiona în store
    name: 'faq',
    
    // Reducer-ul pentru a gestiona starea
    reducer: faqReducer,
    
    // O funcție care înregistrează componentele UI
    initComponents: () => ({
        faqModal: new FaqModal()
    }),
    
    // O funcție care leagă evenimentele specifice acestui feature
    bindEvents: (dom, store) => {
        // CORECTAT: Acum apelul este învelit în store.dispatch()
        dom.faqModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, () => store.dispatch(faqActions.closeFaq()));

        // Ascultă acțiunea de pe FAB menu
        dom.fabContainer.addEventListener('fab-action', (e) => {
            if (e.detail.action === FAB_ACTIONS.SHOW_FAQ) {
                store.dispatch(faqActions.openFaq());
            }
        });
    }
};