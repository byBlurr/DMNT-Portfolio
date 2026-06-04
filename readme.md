# High-Performance Photography Portfolio Codebase

A single-page vanilla JavaScript web application built to serve as a photographic portfolio. The architecture focuses on offline reliability, memory-safe event handling, and real-time client-side binary stream extraction without server-side dependencies.

---

## 🛠 Technical Architecture & Execution Lifecycle

### 1. Bootstrapping & Theme Restoration
On window initialization, the script triggers the bootstrap sequence:
*   Queries `localStorage` for a cached `theme` state token string.
*   Manipulates body DOM tokens (`.light-mode`) prior to rendering layout elements to avoid Flash of Unstyled Content (FOUC).
*   Invokes the static manifest compilation loop.

### 2. The Static Manifest Pipeline
To bypass Cross-Origin Resource Sharing (CORS) security constraints inherent when previewing applications via the `file:///` local protocol, the system drops classic AJAX/Fetch request patterns:
*   The application natively injects `images/manifest.js` as an explicit global script variable dependency.
*   `loadStaticManifest()` evaluates the presence of `portfolioManifest` in global memory scope.
*   Object properties matching category strings are flat-mapped into a single unified workspace array `allDiscoveredItems`.

### 3. Dynamic Array Mutation (Fisher-Yates)
When active filter configurations change, `generateAndRenderGallery()` isolates target image object definitions:
*   A localized array subset pointer slice (`targetPool`) is instantiated.
*   An unbiased Fisher-Yates array permutation loops backward through index allocations, swapping values with a cryptographically uniform `Math.floor(Math.random() * (i + 1))` index factor.
*   If the current tracking filter string is strict to `preview`, a destructive array slice culls allocations down to a hardcapped maximum constraint.

### 4. DOM Garbage Collection & Component Injections
To safeguard mobile browser memory allocation runtimes from heap accumulation during long usage cycles:
*   `galleryGrid.innerHTML = '';` explicitly tears down existing layout tree definitions.
*   New elements are dynamically raised using `document.createElement`.
*   Hardware-accelerated rendering configurations (`decoding="async"`, `loading="lazy"`) are appended inline.
*   A localized `load` event listener hook tracks state updates onto a blurred placeholder layer (`.gallery-item-blur`) to trigger dynamic class dismissals seamlessly.

### 5. Non-Blocking EXIF Header Stream Parsing
When an entry is initialized inside the lightbox, the async metadata pipeline handles image asset updates:
*   The system sets `lightboxImg.exifdata = null` to clear previous parsing references cached inside the `exif-js` instance.
*   A temporary single-instance event hook monitors node loading states via `addEventListener('load', parseExifDataOnLoad)`.
*   Upon execution, binary header streams are scanned for raw EXIF metadata variables.
*   Float calculations safely transform decimal raw frame timings into fraction syntax representations (e.g., `0.0005` translates into `1/2000s`).
*   The event handler self-destructs via `removeEventListener` immediately upon string generation to clean up memory footprints.

---

## 🚦 Application State Tracking

State parameters are maintained globally to synchronize asynchronous tasks and prevent layout race conditions:
*   `allDiscoveredItems (Array)`: Flat reference dictionary compiling all validated image nodes.
*   `activeImagePool (Array)`: Mutable subset tracking actively rendered, shuffled nodes within the viewport canvas.
*   `currentActiveFilter (String)`: The string variable controlling current structural sorting states.
*   `currentLightboxIndex (Number)`: The integer pointer directing linear forward/backward lightbox calculations.
*   `isRotationLocked (Boolean)`: Flag managing automated interval interval cycles.
*   `rotationTimer (Timer Object)`: Stored handle powering background interval generation routines.

---

## 📦 File Mapping Matrix

```text
├── index.html            # Core semantic markup structuring component wrappers & SEO JSON-LD schema strings.
├── style.css             # Fluid variable layout system mapping responsive column matrixes & component states.
├── script.js             # Logic controller containing core array algorithms, event loops & EXIF parsing hooks.
└── images/
    └── manifest.js       # Global module string array mapping system. Must match structural directory layouts.
```

---

## 🚀 Deployment Dependency (Manifest Assembly)

The application depends on `portfolioManifest` declaring exact array allocations inside `images/manifest.js`. To expand the codebase file array references, your compiled structural data script file must output explicitly as follows:

```javascript
const portfolioManifest = {
    sport: [
        "filename-1.jpg",
        "filename-2.jpg"
    ],
    automotive: [
        "filename-3.jpg"
    ],
    wildlife: [],
    other: []
};
```