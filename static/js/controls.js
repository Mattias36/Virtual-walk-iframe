import { state } from './state.js';
import { updateFrames, drawScene, replayHighlightAnimation } from './renderer.js';
import { toggleSidebar, selectApartment } from './ui.js';

const container = document.getElementById('container-360');
const colorIdDisplay = document.getElementById('color-id');
const tooltip = document.getElementById('apartment-tooltip');

const MIN_FAR_ZOOM = 1;
const MAX_FAR_ZOOM = 2.5;
const FAR_ZOOM_STEP = 0.25;

export function changeZoom(direction) {
    if (state.viewType !== 'far') return;

    state.zoom = Math.min(
        MAX_FAR_ZOOM,
        Math.max(MIN_FAR_ZOOM, state.zoom + direction * FAR_ZOOM_STEP)
    );

    applyFarZoomTransform();
    updateFarMapViewport();

    const zoomOutButton = document.querySelector('.far-zoom-buttons button:last-child');
    const zoomInButton = document.querySelector('.far-zoom-buttons button:first-child');
    if (zoomOutButton) zoomOutButton.disabled = state.zoom <= MIN_FAR_ZOOM;
    if (zoomInButton) zoomInButton.disabled = state.zoom >= MAX_FAR_ZOOM;
}

export function resetZoom() {
    state.zoom = MIN_FAR_ZOOM;
    state.panX = 0;
    state.panY = 0;
    [document.getElementById('main-canvas'), document.getElementById('highlight-canvas')].forEach(canvasElement => {
        if (canvasElement) canvasElement.style.transform = '';
    });
    updateFarMapViewport();
}

export function centerFarView() {
    if (state.viewType !== 'far') return;

    state.panX = 0;
    state.panY = 0;
    applyFarZoomTransform();
    updateFarMapViewport();
}

export function toggleFarMap() {
    const mapPanel = document.getElementById('far-map-panel');
    const toggle = document.getElementById('far-map-toggle');
    if (!mapPanel || !toggle) return;

    const isHidden = mapPanel.classList.toggle('hidden');
    toggle.textContent = isHidden ? 'Pokaż mapę' : 'Ukryj mapę';
    toggle.setAttribute('aria-expanded', String(!isHidden));
}

function applyFarZoomTransform() {
    const panX = -state.panX * (state.zoom - 1) * 50;
    const panY = -state.panY * (state.zoom - 1) * 50;
    const transform = `translate(${panX}%, ${panY}%) scale(${state.zoom})`;

    [document.getElementById('main-canvas'), document.getElementById('highlight-canvas')].forEach(canvasElement => {
        if (canvasElement) canvasElement.style.transform = transform;
    });
}

function updateFarMapViewport() {
    const viewport = document.getElementById('far-map-viewport');
    if (!viewport) return;

    const width = 100 / state.zoom;
    const height = 100 / state.zoom;
    const centerX = 50 + state.panX * 50;
    const centerY = 50 + state.panY * 50;

    viewport.style.width = `${width}%`;
    viewport.style.height = `${height}%`;
    viewport.style.left = `${centerX - width / 2}%`;
    viewport.style.top = `${centerY - height / 2}%`;
}

function setFarMapCenter(event) {
    const map = document.getElementById('far-map');
    if (!map || state.viewType !== 'far') return;

    const rect = map.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

    state.panX = (x - 0.5) * 2;
    state.panY = (y - 0.5) * 2;
    applyFarZoomTransform();
    updateFarMapViewport();
}

export function updateFarMap() {
    const mapCanvas = document.getElementById('far-map-canvas');
    const source = state.imgBuilding;
    if (!mapCanvas || !source || !source.complete || !source.naturalWidth) return;

    const map = mapCanvas.parentElement;
    const width = map.clientWidth;
    const height = map.clientHeight;
    if (!width || !height) return;

    const pixelRatio = window.devicePixelRatio || 1;
    mapCanvas.width = width * pixelRatio;
    mapCanvas.height = height * pixelRatio;
    const mapContext = mapCanvas.getContext('2d');
    mapContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    mapContext.drawImage(source, 0, 0, width, height);
    updateFarMapViewport();
}

function isApartmentPanelOpen() {
    return document.body.classList.contains('apartment-panel-open');
}

function notifyRotationEnd() {
    window.dispatchEvent(new CustomEvent('apartment-rotation-end'));
}

// 1. Deklarujemy hasDragged na poziomie modułu, aby wszystkie funkcje miały do niej dostęp
let hasDragged = false;
let suppressNextClick = false;
let ignoreMapClickUntil = 0;
let dragStartX = 0;
let dragStartY = 0;

// [USUNIĘTO]: Cały luźny `container.addEventListener('click', ...)` z tego miejsca!

export function rotateToDirection(targetFrame) {
    if (isApartmentPanelOpen()) return;
    if (state.isAnimating || state.isDragging) return;

    if (tooltip) tooltip.classList.add('hidden');

    state.isAnimating = true;

    const highlightCanvas = document.getElementById('highlight-canvas');
    const highlightCtx = highlightCanvas ? highlightCanvas.getContext('2d') : null;

    if (highlightCanvas && highlightCtx) {
        highlightCanvas.style.transition = 'none';
        highlightCanvas.style.animation = 'none';
        highlightCanvas.style.opacity = '0';
        highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
        highlightCanvas.className = '';
        void highlightCanvas.offsetHeight;
    }

    document.querySelectorAll('.btn-compass').forEach(b => b.disabled = true);

    let diff = targetFrame - state.currentFrame;
    if (diff > state.totalFrames / 2) diff -= state.totalFrames;
    if (diff < -state.totalFrames / 2) diff += state.totalFrames;

    const steps = Math.abs(diff);
    const stepDirection = diff > 0 ? 1 : -1;
    let currentStep = 0;

    function animate() {
        if (currentStep >= steps) {
            state.isAnimating = false;
            document.querySelectorAll('.btn-compass').forEach(b => b.disabled = false);

            if (highlightCanvas) {
                highlightCanvas.style.transition = '';
            }

            if (state.showAllStatuses || state.selectedApartment) {
                replayHighlightAnimation();
            } else {
                drawScene();
            }
            notifyRotationEnd();
            return;
        }

        state.currentFrame += stepDirection;
        if (state.currentFrame > state.totalFrames) state.currentFrame -= state.totalFrames;
        if (state.currentFrame < 1) state.currentFrame += state.totalFrames;

        updateFrames();
        currentStep++;
        setTimeout(animate, 15);
    }

    animate();
}

function handleMove(clientX) {
    if (!state.isDragging || !state.canDrag) return;
    const deltaX = clientX - state.startX;

    if (Math.abs(deltaX) >= state.sensitivity) {
        const frameShift = Math.floor(deltaX / state.sensitivity);
        if (frameShift !== 0) {
            hasDragged = true;
            suppressNextClick = true;
            ignoreMapClickUntil = performance.now() + 500;
        }
        state.currentFrame += frameShift;

        if (state.currentFrame > state.totalFrames) state.currentFrame -= state.totalFrames;
        else if (state.currentFrame < 1) state.currentFrame += state.totalFrames;

        updateFrames();
        state.startX = clientX;
    }
}

export function initControls() {
    if (!container) return;

    const farMap = document.getElementById('far-map');
    if (farMap) {
        farMap.addEventListener('pointerdown', setFarMapCenter);
        farMap.addEventListener('pointermove', event => {
            if (event.buttons) setFarMapCenter(event);
        });
    }
    window.addEventListener('far-map-update', updateFarMap);

    // Ruch myszy z wykorzystaniem requestAnimationFrame
    container.addEventListener('mousemove', (e) => {
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;

        if (!state.ticking && !state.isDragging && !state.isAnimating) {
            window.requestAnimationFrame(() => {
                drawScene();
                state.ticking = false;
            });
            state.ticking = true;
        }
    });

    container.addEventListener('mousedown', (e) => {
        if (isApartmentPanelOpen()) return;
        if (state.isAnimating) return;
        state.isDragging = true;
        hasDragged = false;
        state.startX = e.clientX;
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        if (state.isDragging) {
            state.isDragging = false;
            const didDrag = hasDragged;
            suppressNextClick = didDrag;
            
            // Jeśli faktycznie obracaliśmy, zerujemy pozycję klastra hover, 
            // aby uniknąć przypadkowego podświetlenia mieszkania w miejscu puszczenia
            if (hasDragged) {
                state.mouseX = -1;
                state.mouseY = -1;
                state.hoveredApartment = state.selectedApartment;
            }
            
            if (state.showAllStatuses || state.selectedApartment) {
                replayHighlightAnimation();
            } else {
                drawScene();
            }
            if (didDrag) notifyRotationEnd();
        }
    });

    window.addEventListener('mouseleave', () => {
        state.isDragging = false;
        drawScene();
    });

    window.addEventListener('mousemove', (e) => {
        if (isApartmentPanelOpen()) {
            state.isDragging = false;
            return;
        }

        state.mouseX = e.clientX;
        state.mouseY = e.clientY;

        if (state.isDragging) {
            const deltaX = Math.abs(e.clientX - state.startX);
            if (deltaX > 4) {
                hasDragged = true;
            }
            handleMove(e.clientX);
        } else {
            // Jeśli nie przeciągamy, każde poruszenie myszą przerysowuje scenę (dla tooltipa/hovera)
            drawScene();
        }
    });

    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) {
        canvasWrapper.addEventListener('mouseleave', () => {
            state.mouseX = -1;
            state.mouseY = -1;
            state.mapHoveredApartment = null;
            window.dispatchEvent(new CustomEvent('apartment-map-hover', {
                detail: { apartment: null }
            }));
            drawScene();
        });
    }

    // JEDYNE I PRAWIDŁOWE MIEJSCE OBSŁUGI KLIKNIĘCIA
    container.addEventListener('click', (e) => {
        if (isApartmentPanelOpen()) return;
        if (performance.now() < ignoreMapClickUntil) return;
        if (suppressNextClick) {
            suppressNextClick = false;
            hasDragged = false;
            return;
        }
        if (state.showAllStatuses) return;

        if (hasDragged || state.isAnimating) {
            hasDragged = false;
            return;
        }

        if (state.hoveredApartment) {
            const aptId = typeof state.hoveredApartment === 'object'
                ? state.hoveredApartment.id
                : state.hoveredApartment;

            if (aptId) {
                selectApartment(aptId);
            }
        }
    });

    // Touch Support
    let touchStartX = 0;
    let touchStartY = 0;

    container.addEventListener('touchstart', (e) => {
        if (isApartmentPanelOpen()) return;
        if (state.isAnimating) return;
        state.isDragging = true;
        hasDragged = false;

        const touch = e.touches[0];
        state.startX = touch.clientX;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        state.mouseX = touch.clientX;
        state.mouseY = touch.clientY;

        if (tooltip) tooltip.classList.add('hidden');
    });

    window.addEventListener('touchend', (e) => {
        if (state.isDragging) {
            state.isDragging = false;
            const didDrag = hasDragged;
            suppressNextClick = didDrag;

            // Na telefonie po zakończeniu obrotu zerujemy dotyk – palec został odjęty od ekranu!
            // Dzięki temu mieszkanie pod palcem NIE podświetli się po puszczeniu obrotu.
            if (hasDragged) {
                state.mouseX = -1;
                state.mouseY = -1;
                state.hoveredApartment = state.selectedApartment;
            }

            if (state.showAllStatuses || state.selectedApartment) {
                replayHighlightAnimation();
            } else {
                drawScene();
            }
            if (didDrag) notifyRotationEnd();
        }
    });
    
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - touchStartX);
            const deltaY = Math.abs(touch.clientY - touchStartY);

            if (deltaX > 4 || deltaY > 4) {
                hasDragged = true;
            }

            state.mouseX = touch.clientX;
            state.mouseY = touch.clientY;

            if (state.isDragging) {
                handleMove(touch.clientX);
            } else {
                drawScene();
            }
        }
    });
    // Blokowanie propagacji na elementy interfejsu UI
    const stopUIPropagation = (e) => e.stopPropagation();
    const uiElements = [
        document.querySelector('.compass-wrapper'),
        document.getElementById('far-zoom-controls'),
        document.getElementById('sidebar-container'),
        document.getElementById('apartment-sidebar')
    ];

    uiElements.forEach(element => {
        if (element) {
            element.addEventListener('mousedown', stopUIPropagation);
            element.addEventListener('mousemove', stopUIPropagation);
            element.addEventListener('click', stopUIPropagation);
            element.addEventListener('touchstart', stopUIPropagation);
            element.addEventListener('touchmove', stopUIPropagation);
        }
    });

    initFullscreen();
}

function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
}

function exitFullscreenIfNeeded() {
    const activeFullscreen = getFullscreenElement();
    if (!activeFullscreen) return;

    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
}

function requestFullscreenFor(container) {
    if (!container) return;

    if (container.requestFullscreen) container.requestFullscreen();
    else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
    else if (container.msRequestFullscreen) container.msRequestFullscreen();
}

function getFullscreenRoot() {
    return document.documentElement || document.body;
}

function syncFullscreenToTarget() {
    const fullscreenRoot = getFullscreenRoot();
    const activeFullscreen = getFullscreenElement();

    if (!fullscreenRoot || !activeFullscreen) {
        return;
    }

    if (activeFullscreen === fullscreenRoot) {
        return;
    }

    // W przypadku przełączania widoków w trybie fullscreen zachowujemy
    // aktywny stan pełnego ekranu na elemencie dokumentu, a stylowanie
    // przekazujemy do aktualnie widocznego kontenera.
    return;
}

function updateFullscreenButtonIcon(button) {
    if (!button) return;

    const iconEnter = button.querySelector('.icon-fullscreen-enter');
    const iconExit = button.querySelector('.icon-fullscreen-exit');
    const isFullscreen = !!getFullscreenElement();

    if (iconEnter) iconEnter.classList.toggle('hidden', isFullscreen);
    if (iconExit) iconExit.classList.toggle('hidden', !isFullscreen);
}

function bindFullscreenButton(button, container) {
    if (!button) return;

    const fullscreenRoot = getFullscreenRoot();
    const targetContainer = container || fullscreenRoot;

    button.addEventListener('click', (e) => {
        e.stopPropagation();

        const activeFullscreen = getFullscreenElement();

        if (activeFullscreen === fullscreenRoot) {
            exitFullscreenIfNeeded();
            return;
        }

        if (activeFullscreen) {
            exitFullscreenIfNeeded();
        }

        requestAnimationFrame(() => {
            requestFullscreenFor(fullscreenRoot || targetContainer);
        });
    });

    button.addEventListener('mousedown', (e) => e.stopPropagation());
    button.addEventListener('mouseup', (e) => e.stopPropagation());
}

function initFullscreen() {
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const btnFullscreenWalk = document.getElementById('btn-fullscreen-walk');
    const container360 = document.getElementById('container-360');
    const containerWalk = document.getElementById('container-walk');

    if (btnFullscreen) bindFullscreenButton(btnFullscreen, container360);
    if (btnFullscreenWalk) bindFullscreenButton(btnFullscreenWalk, containerWalk);

    const handleFullscreenChange = () => {
        updateFullscreenButtonIcon(document.getElementById('btn-fullscreen'));
        updateFullscreenButtonIcon(document.getElementById('btn-fullscreen-walk'));
        setTimeout(() => drawScene(), 150);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

export function switchMode(mode) {
    console.log("Przełączanie trybu na: ", mode);

    state.currentMode = mode;

    const containerMakieta = document.getElementById('container-360');
    const containerWalk = document.getElementById('container-walk');
    const legendBox = document.getElementById('legend-box');
    const statusBtn = document.getElementById('btn-toggle-legend');

    if (mode === 'walk') {
        state.showAllStatuses = false;

        const highlightCanvas = document.getElementById('highlight-canvas');
        if (highlightCanvas) {
            const hCtx = highlightCanvas.getContext('2d');
            if (hCtx) hCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
            highlightCanvas.className = '';
        }

        if (statusBtn) statusBtn.classList.remove('active');
        if (legendBox) legendBox.classList.add('hidden');

        if (window.viewer && typeof window.viewer.destroy === 'function') {
            window.viewer.destroy();
            window.viewer = null;
        }

        window.userHasNavigated = false;

        if (containerMakieta) containerMakieta.classList.add('hidden');
        if (containerWalk) containerWalk.classList.remove('hidden');

        if (getFullscreenElement()) {
            syncFullscreenToTarget();
        }

        setTimeout(() => {
            if (typeof initPanorama === 'function') {
                initPanorama();
            }
        }, 100);

    } else if (mode === 'makieta') {
        if (containerWalk) containerWalk.classList.add('hidden');
        if (containerMakieta) containerMakieta.classList.remove('hidden');

        if (getFullscreenElement()) {
            syncFullscreenToTarget();
        }

        if (legendBox) legendBox.classList.add('hidden');
        if (statusBtn) statusBtn.classList.remove('active');

        if (window.viewer && typeof window.viewer.destroy === 'function') {
            window.viewer.destroy();
            window.viewer = null;
        }

        setTimeout(() => {
            drawScene();
        }, 100);
    }
}