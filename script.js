// CONFIGURATION: Map category names to their respective subfolder paths
const subfolders = [
    { name: 'motorsport', path: 'images/motorsport/' },
    { name: 'sport', path: 'images/sport/' },
    { name: 'automotive', path: 'images/automotive/' },
    { name: 'animals', path: 'images/animals/' },
    { name: 'landscapes', path: 'images/landscapes/' },
    { name: 'portraits', path: 'images/portraits/' },
    { name: 'other', path: 'images/other/' }
];
const imageExtension = 'jpg'; 

// DISPLAY RULES: Limit to 9 images and rotate them every 30 seconds (30000ms)
const MAX_DISPLAY_LIMIT = 9;
const ROTATION_INTERVAL = 30000; 

const galleryGrid = document.getElementById('galleryGrid');
const emptyState = document.getElementById('emptyState');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxCounter = document.getElementById('lightboxCounter'); 

// Lightbox Navigation Selectors
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

// Controls Selectors
const rotationToggle = document.getElementById('rotationToggle');
const iconPause = rotationToggle.querySelector('.icon-pause');
const iconPlay = rotationToggle.querySelector('.icon-play');
const aboutToggle = document.getElementById('aboutToggle');
const aboutSection = document.getElementById('aboutSection');

let allDiscoveredItems = [];
let currentFolderIndex = 0;
let currentFileIndex = 1;
let rotationTimer = null;
let currentActiveFilter = 'all'; // Tracks your currently selected menu tab
let isRotationLocked = false;     // Tracks manual suspension status

// Navigation Memory Shifting Anchors
let activeImagePool = [];
let currentLightboxIndex = 0;

// 1. Asynchronously traverse category directories sequentially
function scanSubfolders() {
    if (currentFolderIndex >= subfolders.length) {
        // Kick off the initial layout load process
        generateAndRenderGallery();
        // Start the automated 30-second loop interval
        startAutoRotationLoop();
        return;
    }

    const currentFolder = subfolders[currentFolderIndex];
    const testImg = new Image();
    const srcUrl = `${currentFolder.path}${currentFileIndex}.${imageExtension}`;
    
    testImg.src = srcUrl;
    
    testImg.onload = function() {
        allDiscoveredItems.push({
            src: srcUrl,
            category: currentFolder.name
        });
        currentFileIndex++;
        scanSubfolders();
    };

    testImg.onerror = function() {
        currentFolderIndex++;
        currentFileIndex = 1; 
        scanSubfolders();
    };
}

// 2. Extracts, randomises, and prints elements based on current filter status
function generateAndRenderGallery() {
    let targetPool = [];
    if (currentActiveFilter === 'all') {
        targetPool = [...allDiscoveredItems];
    } else {
        targetPool = allDiscoveredItems.filter(item => item.category === currentActiveFilter);
    }

    // Fisher-Yates shuffle engine executes on the extracted category subset
    for (let i = targetPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targetPool[i], targetPool[j]] = [targetPool[j], targetPool[i]];
    }

    // Slice collection cleanly down to the maximum display cap metric
    activeImagePool = targetPool.slice(0, MAX_DISPLAY_LIMIT);

    // Check to reveal "no images available" message if sliced subset is 0
    checkCategoryCount(activeImagePool);

    // Wipe the layout grid safely and inject brand new card components
    galleryGrid.innerHTML = '';
    
    activeImagePool.forEach((itemData, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item fade-out';
        item.setAttribute('data-category', itemData.category);
        
        const img = document.createElement('img');
        img.src = itemData.src;
        img.alt = `Photography work under ${itemData.category}`;
        img.loading = 'lazy';

        item.appendChild(img);
        galleryGrid.appendChild(item);

        // Open Lightbox Event: Open targets, configure anchors, and pause timers
        item.addEventListener('click', () => {
            currentLightboxIndex = index;
            updateLightboxContent();
            lightbox.classList.add('active');
            stopAutoRotationLoop(); 
        });

        setTimeout(() => {
            item.classList.remove('fade-out');
        }, 50);
    });
}
// Lightbox Syncing Renderer Subroutine Module
function updateLightboxContent() {
    if (activeImagePool.length === 0) return;
    
    const activeData = activeImagePool[currentLightboxIndex];
    lightboxImg.src = activeData.src;
    
    const activeNumber = String(currentLightboxIndex + 1).padStart(2, '0');
    const totalNumber = String(activeImagePool.length).padStart(2, '0');
    lightboxCounter.textContent = `${activeNumber} / ${totalNumber}`;
}

// Linear Array Pointer Shifter Module with Transitional Crossfade Hold
function navigateLightbox(direction) {
    if (activeImagePool.length === 0) return;
    
    // Add transitioning fade-out class to image element
    lightboxImg.classList.add('lightbox-changing');
    
    // Wait for the fade-out duration before changing image content source
    setTimeout(() => {
        currentLightboxIndex += direction;
        
        // Check edge boundaries for full rotational loop cycling wrap-around
        if (currentLightboxIndex >= activeImagePool.length) {
            currentLightboxIndex = 0;
        } else if (currentLightboxIndex < 0) {
            currentLightboxIndex = activeImagePool.length - 1;
        }
        
        updateLightboxContent();
        
        // Remove class to trigger smooth fade back in
        lightboxImg.classList.remove('lightbox-changing');
    }, 200); // Short millisecond transition block
}

// 3. Automated 30-second cycle engine control blocks
function startAutoRotationLoop() {
    clearInterval(rotationTimer);
    
    // Safely block timer initialisation if the user paused rotation
    if (isRotationLocked) return;
    
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
    startAutoRotationLoop(); // Resumes background image updates instantly
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
        const fadeHandler = function() {
            if (emptyState.classList.contains('fade-out')) {
                emptyState.classList.add('hidden');
            }
            emptyState.removeEventListener('transitionend', fadeHandler);
        };
        emptyState.addEventListener('transitionend', fadeHandler);
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

// Inline Directional Click Button Event Mappings
lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation(); // Keep click from falling through and firing a close modal trigger
    navigateLightbox(-1);
});
lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
});

// Unified Lightbox Dismiss Triggers (Fires dismissLightbox to resume timer)
lightboxClose.addEventListener('click', dismissLightbox);
lightbox.addEventListener('click', (e) => { 
    if (e.target === lightbox) dismissLightbox(); 
});

// Extended Keyboard Tracking Array (Tracks Arrow Keys and Escape)
window.addEventListener('keydown', (e) => { 
    if (!lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') dismissLightbox();
    else if (e.key === 'ArrowLeft') navigateLightbox(-1);
    else if (e.key === 'ArrowRight') navigateLightbox(1);
});

// Fire pipelines, activate category filters, and print copyright context
scanSubfolders();
setupFilterInteractions();
injectCurrentYear();
