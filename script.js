// CONFIGURATION: Base paths for your assets matching your folder structures
const folderPaths = {
    sport: 'images/sport/',
    automotive: 'images/automotive/',
    wildlife: 'images/wildlife/',
    other: 'images/other/'
};

// DISPLAY RULES: Limit to 9 images on "Preview", but show everything on single categories
const MAX_DISPLAY_LIMIT = 9;
const ROTATION_INTERVAL = 30000; 

const galleryGrid = document.getElementById('galleryGrid');
const emptyState = document.getElementById('emptyState');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxCounter = document.getElementById('lightboxCounter'); 
const lightboxCategory = document.getElementById('lightboxCategory'); // ADDED: New structural category selector

// Lightbox Navigation Selectors
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

// Controls Selectors
const rotationToggle = document.getElementById('rotationToggle');
const iconPause = rotationToggle.querySelector('.icon-pause');
const iconPlay = rotationToggle.querySelector('.icon-play');
const aboutToggle = document.getElementById('aboutToggle');
const aboutSection = document.getElementById('aboutSection');
const themeToggle = document.getElementById('themeToggle');
const iconSun = themeToggle.querySelector('.icon-sun');
const iconMoon = themeToggle.querySelector('.icon-moon');

let allDiscoveredItems = [];
let rotationTimer = null;
let currentActiveFilter = 'preview'; 
let isRotationLocked = false;     // Tracks manual suspension status

// Navigation Memory Shifting Anchors
let activeImagePool = [];
let currentLightboxIndex = 0;

// Swipe detection
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 50;

// Initialize theme from localStorage
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        iconSun.classList.add('hidden');
        iconMoon.classList.remove('hidden');
    } else {
        document.body.classList.remove('light-mode');
        iconSun.classList.remove('hidden');
        iconMoon.classList.add('hidden');
    }
}

// NATIVE VARIABLE ENGINE: Maps directly to the linked manifest script file. Works 100% offline via file:/// protocol.
function loadStaticManifest() {
    allDiscoveredItems = [];
    
    // Check if the batch file global variable is present on load
    if (typeof portfolioManifest !== 'undefined') {
        Object.keys(portfolioManifest).forEach(category => {
            const fileNamesArray = portfolioManifest[category];
            const basePath = folderPaths[category];
            
            if (basePath && fileNamesArray) {
                fileNamesArray.forEach(fileName => {
                    allDiscoveredItems.push({
                        src: `${basePath}${fileName}`,
                        category: category
                    });
                });
            }
        });
    } else {
        console.error("The portfolioManifest variable is not defined. Ensure images/manifest.js was generated.");
    }

    // Instantly reveal your error-free gallery canvas layout
    generateAndRenderGallery();
    startAutoRotationLoop();
}

// 2. Extracts, randomises, and prints elements based on current filter status
function generateAndRenderGallery() {
    let targetPool = [];
    if (currentActiveFilter === 'preview') {
        targetPool = [...allDiscoveredItems];
    } else {
        targetPool = allDiscoveredItems.filter(item => item.category === currentActiveFilter);
    }

    // Fisher-Yates shuffle engine executes on the extracted category subset
    for (let i = targetPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targetPool[i], targetPool[j]] = [targetPool[j], targetPool[i]];
    }

    // Only cap at 9 if "Preview" is active. Otherwise, render the entire pool.
    if (currentActiveFilter === 'preview') {
        activeImagePool = targetPool.slice(0, MAX_DISPLAY_LIMIT);
    } else {
        activeImagePool = targetPool;
    }

    // Check to reveal "no images available" message if sliced subset is 0
    checkCategoryCount(activeImagePool);

    // Wipe the layout grid safely and inject brand new card components
    galleryGrid.innerHTML = '';
    
    activeImagePool.forEach((itemData, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item fade-out';
        item.setAttribute('data-category', itemData.category);
        
        // Create blur-up placeholder effect
        const wrapper = document.createElement('div');
        wrapper.className = 'gallery-item-wrapper';
        
        // Low-quality blur placeholder (using inline data URI or subtle gradient)
        const blur = document.createElement('div');
        blur.className = 'gallery-item-blur';
        blur.style.backgroundImage = `url('${itemData.src}')`;
        
        const img = document.createElement('img');
        img.src = itemData.src;
        img.alt = `Photography work under ${itemData.category}`;
        img.loading = 'lazy';
        img.decoding = 'async';
        
        // Handle image load for blur-up effect
        img.onload = function() {
            blur.classList.add('loaded');
        };

        wrapper.appendChild(blur);
        wrapper.appendChild(img);
        item.appendChild(wrapper);
        galleryGrid.appendChild(item);

        // Open Lightbox Event: Open targets, configure anchors, and pause timers
        item.addEventListener('click', () => {
            currentLightboxIndex = index;
            updateLightboxContent();
            lightbox.classList.add('active');
            stopAutoRotationLoop();
            document.body.style.overflow = 'hidden';
        });

        setTimeout(() => {
            item.classList.remove('fade-out');
        }, 50);
    });
}
const lightboxExif = document.getElementById('lightboxExif'); // New Exif Selector
// Lightbox Syncing Renderer Subroutine Module with Async Exif Extraction
function updateLightboxContent() {
    if (activeImagePool.length === 0) return;
    
    const activeData = activeImagePool[currentLightboxIndex];
    
    // Clear out any previous text to prevent layout overlapping jumps
    lightboxExif.textContent = "reading data...";

    // Bind the image data load directly to the DOM-bound target component to allow data reading
    lightboxImg.onload = function() {
        if (typeof EXIF !== 'undefined') {
            EXIF.getData(lightboxImg, function() {
                const model = EXIF.getTag(this, 'Model');
                const focalLength = EXIF.getTag(this, 'FocalLength');
                const fNumber = EXIF.getTag(this, 'FNumber');
                const exposureTime = EXIF.getTag(this, 'ExposureTime');
                const iso = EXIF.getTag(this, 'ISO');
                
                // If no EXIF data found, clear and return
                if (!model && !focalLength && !fNumber && !exposureTime && !iso) {
                    lightboxExif.textContent = "";
                    return;
                }
                
                // Format Shutter Speed decimal floats cleanly into fractions (e.g., 0.0005 -> 1/2000s)
                let shutter = "---";
                if (exposureTime) {
                    if (exposureTime < 1) {
                        shutter = `1/${Math.round(1 / exposureTime)}s`;
                    } else {
                        shutter = `${exposureTime}s`;
                    }
                }
                
                // Gather variables and handle null fallbacks safely
                const camera = model || "Unknown Camera";
                const focal = focalLength ? `${Math.round(focalLength)}mm` : "---";
                const fStop = fNumber ? `f/${fNumber}` : "---";
                const isoVal = iso ? `ISO ${iso}` : "---";
                
                // Typeset the finished editorial horizontal metadata strip
                lightboxExif.textContent = `${camera}   //   ${focal}   //   ${fStop}   //   ${shutter}   //   ${isoVal}`;
            });
        } else {
            lightboxExif.textContent = "";
        }
        // Remove the listener hook safely to prevent stacked operational executions on subsequent flips
        lightboxImg.onload = null;
    };
    
    lightboxImg.src = activeData.src;
    
    // Sync the sequential counter numbers (01 / 09)
    const activeNumber = String(currentLightboxIndex + 1).padStart(2, '0');
    const totalNumber = String(activeImagePool.length).padStart(2, '0');
    lightboxCounter.textContent = `${activeNumber} / ${totalNumber}`;

    // ADDED: Inject the active photograph's category name into the structural text area
    if (lightboxCategory) {
        lightboxCategory.textContent = activeData.category;
    }
}

// Linear Array Pointer Shifter Module with Transitional Crossfade Hold
function navigateLightbox(direction) {
    if (activeImagePool.length === 0) return;
    
    lightboxImg.classList.add('lightbox-changing');
    
    setTimeout(() => {
        currentLightboxIndex += direction;
        
        if (currentLightboxIndex >= activeImagePool.length) {
            currentLightboxIndex = 0;
        } else if (currentLightboxIndex < 0) {
            currentLightboxIndex = activeImagePool.length - 1;
        }
        
        updateLightboxContent();
        lightboxImg.classList.remove('lightbox-changing');
    }, 200); 
}

// 3. Automated cycle engine control blocks
function startAutoRotationLoop() {
    clearInterval(rotationTimer);
    if (isRotationLocked || currentActiveFilter !== 'preview') return;
    
    rotationTimer = setInterval(() => {
        const activeItems = document.querySelectorAll('.gallery-item');
        if (activeItems.length === 0) {
            generateAndRenderGallery();
            return;
        }
        activeItems.forEach(item => item.classList.add('fade-out'));
        setTimeout(() => {
            generateAndRenderGallery();
        }, 600);
    }, ROTATION_INTERVAL);
}

// 4. Stop the loop cleanly while user is previewing an image
function stopAutoRotationLoop() {
    clearInterval(rotationTimer);
}

// 5. Lightbox close trigger helper: Closes modal and safely restarts rotation
function dismissLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    startAutoRotationLoop(); 
}
// 6. Manual user filtering menu button bindings
function setupFilterInteractions() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) return; 
            document.querySelector('.filter-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentActiveFilter = btn.getAttribute('data-filter');
            
            if (currentActiveFilter === 'preview') {
                rotationToggle.style.display = 'flex';
            } else {
                rotationToggle.style.display = 'none';
            }
            
            const activeItems = document.querySelectorAll('.gallery-item');
            if (activeItems.length > 0) {
                activeItems.forEach(item => item.classList.add('fade-out'));
                setTimeout(() => {
                    generateAndRenderGallery();
                    startAutoRotationLoop();
                }, 400);
            } else {
                generateAndRenderGallery();
                startAutoRotationLoop();
            }
        });
    });
}

// 7. Counts active targets and slides open fallback notice if collection scales to 0
function checkCategoryCount(limitedItemsPool) {
    if (limitedItemsPool.length === 0) {
        emptyState.classList.remove('hidden');
        setTimeout(() => {
            emptyState.classList.remove('fade-out');
        }, 50);
    } else {
        emptyState.classList.add('fade-out');
        emptyState.addEventListener('transitionend', function() {
            if (emptyState.classList.contains('fade-out')) {
                emptyState.classList.add('hidden');
            }
        }, { once: true });
    }
}

// 8. Manual Rotation Toggle Binding Logic (Updated for Play/Pause icons)
rotationToggle.addEventListener('click', () => {
    isRotationLocked = !isRotationLocked;
    if (isRotationLocked) {
        stopAutoRotationLoop();
        rotationToggle.classList.add('locked');
        iconPause.classList.add('hidden');
        iconPlay.classList.remove('hidden');
    } else {
        rotationToggle.classList.remove('locked');
        iconPause.classList.remove('hidden');
        iconPlay.classList.add('hidden');
        startAutoRotationLoop();
    }
});

// 9. Dynamic Copyright Date Engine
function injectCurrentYear() {
    const yearTarget = document.getElementById('copyrightYear');
    if (yearTarget) {
        yearTarget.textContent = new Date().getFullYear();
    }
}

// 10. Inline About Toggle Controller
aboutToggle.addEventListener('click', () => {
    const isHidden = aboutSection.classList.contains('hidden');
    if (isHidden) {
        aboutSection.classList.remove('hidden');
        aboutToggle.classList.add('active');
    } else {
        aboutSection.classList.add('hidden');
        aboutToggle.classList.remove('active');
    }
});
// 11. Dark/Light Mode Toggle
themeToggle.addEventListener('click', () => {
    const isDarkMode = !document.body.classList.contains('light-mode');
    if (isDarkMode) {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        iconSun.classList.add('hidden');
        iconMoon.classList.remove('hidden');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        iconSun.classList.remove('hidden');
        iconMoon.classList.add('hidden');
    }
});

// Inline Directional Click Button Event Mappings
lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation(); 
    navigateLightbox(-1);
});
lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
});

// Unified Lightbox Dismiss Triggers
lightboxClose.addEventListener('click', dismissLightbox);
lightbox.addEventListener('click', (e) => { 
    dismissLightbox(); 
});

// Swipe gesture detection
lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.touches.clientX;
    touchStartY = e.touches.clientY;
}, { passive: true });

lightbox.addEventListener('touchend', (e) => {
    if (!lightbox.classList.contains('active')) return;
    
    const touchEndX = e.changedTouches.clientX;
    const touchEndY = e.changedTouches.clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Only register horizontal swipes
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
        if (deltaX > 0) {
            // Swiped right - previous image
            navigateLightbox(-1);
        } else {
            // Swiped left - next image
            navigateLightbox(1);
        }
    }
}, { passive: true });

// Extended Keyboard Tracking Array (Tracks Arrow Keys and Escape)
window.addEventListener('keydown', (e) => { 
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') dismissLightbox();
    else if (e.key === 'ArrowLeft') navigateLightbox(-1);
    else if (e.key === 'ArrowRight') navigateLightbox(1);
});

// MODIFIED INITIALIZATION LIFECYCLE: Read the generated static manifest file natively as a script element variable
window.addEventListener('load', () => {
    initTheme();
    loadStaticManifest();
    setupFilterInteractions();
    injectCurrentYear();
});
