// src/js/features/faq/index.js
import { faqReducer } from './faqReducer.js';
import * as faqActions from './faqActions.js';
import { FaqModal } from './components/FaqModal.js';
import { CUSTOM_EVENTS, FAB_ACTIONS } from '../../shared/utils/constants.js';

export default {
    name: 'faq',
    reducer: faqReducer,
    initComponents: () => ({
        faqModal: new FaqModal()
    }),
    bindEvents: (dom, store) => {
        dom.faqModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, () => store.dispatch(faqActions.closeFaq()));
        dom.fabContainer.addEventListener('fab-action', (e) => {
            if (e.detail.action === FAB_ACTIONS.SHOW_FAQ) {
                store.dispatch(faqActions.openFaq());
            }
        });

        // NOU: Gestionarea evenimentelor de la tastatură, specifică acestui modul.
        window.addEventListener('keydown', (e) => {
            const state = store.getState();
            if (state.faq.isOpen && e.key === 'Escape') {
                store.dispatch(faqActions.closeFaq());
            }
        });
    },
    syncUI: ({ components, state, oldState }) => {
        const currentFaq = state.faq;
        const oldFaq = oldState.faq || {};
        if (currentFaq.isOpen !== oldFaq.isOpen) {
            if (currentFaq.isOpen) {
                if (currentFaq.data) {
                    components.faqModal.populate(currentFaq.data);
                }
                components.faqModal.open();
            } else {
                components.faqModal.close();
            }
        }
    }
};