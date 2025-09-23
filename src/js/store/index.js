// src/js/store/index.js
import { createstore } from './createStore.js';
import { default_state } from '../utils/constants.js';

const store = createstore(default_state);

export default store;