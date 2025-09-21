<!--
Guidance for AI coding agents working on this repository.
Keep this file concise (20-50 lines) and focused on project-specific patterns,
entry points, and examples. Update only when you discover new, actionable
conventions in the codebase.
-->

# Copilot / AI assistant instructions — Ghidul Plantei (frontend)

- Project type: small single-page, vanilla JS app (no bundler). Entry: `Index.html` -> `src/js/main.js`.
- Primary architecture: centralized mutable app state in `src/js/core/state.js` (pub/sub). UI components subscribe to state changes.

- Key responsibilities for an AI edit:
  - Preserve the single-source-of-truth: read/modify state only via `getState()`, `updateState()` or `resetState()` in `src/js/core/state.js`.
  - Avoid direct DOM mutation outside components. Use component renderers (`src/js/components/*`) and helpers (`src/js/utils/helpers.js`).

- Important files to reference when making changes:
  - `src/js/main.js` — app bootstrap, event wiring, URL <-> state sync, keyboard handling.
  - `src/js/core/actions.js` — application actions that mutate state and orchestrate side-effects.
  - `src/js/core/state.js` — centralized state + subscribe/notify model.
  - `src/js/services/*` — data loading and pure business logic (e.g. `plantService.js`, `plantLogic.js`, `memoizedLogic.js`).
  - `src/js/components/*` — DOM construction and UI behavior (e.g. `PlantGrid.js`, `PlantModal.js`, `PlantCard.js`).
  - `src/js/utils/*` — constants, helpers, and shared utilities.
  - `assets/data/*.json` — canonical data source (no external API).

- Patterns and conventions observed (use these when adding/modifying code):
  - State is immutable externally: always call `getState()` to read, and `updateState({ ... })` to change. `updateState` will notify subscribers.
  - Components render DOM from state; they expose `.render()` and often accept small POJOs. Example: `PlantGrid.render({ plants, query, isLoading, favoriteIds })`.
  - Data loading is centralized in services and may cache results (e.g. `plantService.loadAndProcessPlantsData()` caches `cachedPlants`).
  - Heavy computations are memoized using `memoize-one` exposed on window (loaded from CDN in `Index.html`) — use `getMemoizedSortedAndFilteredPlants(...)` for filtering/sorting.
  - Custom events are used for cross-component communication. Event names live in `src/js/utils/constants.js` (`CUSTOM_EVENTS`). Use `dispatchEvent(el, eventName, detail)` helper in `src/js/utils/helpers.js` to emit.

- Wire-up and UX rules:
  - Main event wiring happens in `src/js/main.js` (bindEventListeners). Prefer adding high-level actions there rather than directly registering deep DOM listeners elsewhere.
  - URL synchronization handled by `src/js/services/urlService.js`: update state -> `updateURLFromState()` is debounced in `main.js`.
  - Modal components are lazy-imported (dynamic import) in `main.js` — keep asynchronous loading patterns consistent when adding large components.

- Example concrete edits the AI may perform safely:
  - Add a new action in `src/js/core/actions.js` that updates state via `updateState()` and uses existing helpers (e.g. add a bulk-favorite toggle using `favoriteService`).
  - Add a small pure function to `src/js/services/plantLogic.js` and expose a memoized wrapper in `memoizedLogic.js`.
  - Fix bugs in components by changing DOM generation via `createElement` in `src/js/utils/helpers.js` and `src/js/components/*`.

- Things to avoid or be cautious about:
  - Do not mutate `state` directly (no assignments to internal `state` object from other modules).
  - Avoid importing or changing CSS or image asset paths without confirming `Index.html` references.
  - Don't remove the global `memoizeOne` / `morphdom` CDN usage without updating `Index.html` and testing in-browser.

- Developer workflows (how to run / debug):
  - This is a static site. Open `Index.html` in a browser with a local static file server (e.g., `Live Server` in VS Code or `python -m http.server` from the repo root).
  - To debug: open DevTools, set breakpoints in `src/js/*.js`. Watch `state` via `getState()` in console, or subscribe to state changes in `src/js/core/state.js`.

- Quick examples (where to find them):
  - Read-only state access: `src/js/core/actions.js` uses `const { plants } = getState();`.
  - Emitting UI events: `dispatchEvent(this._modalElement, CUSTOM_EVENTS.COPY_REQUEST)` in `src/js/components/PlantModal.js`.
  - Data file paths: `assets/data/plants.json` and `assets/data/faq.json` (see `src/js/utils/constants.js`).

If anything here is unclear or you'd like additional conventions added (testing, new build step, or CI hooks), tell me what to expand and I'll iterate.
