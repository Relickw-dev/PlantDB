// src/js/store/index.js
import { createStore } from './createStore.js';
import { DEFAULT_STATE } from '../utils/constants.js';

const store = createStore(DEFAULT_STATE);

export default store;