import { state } from './state.js';
import { updateFrames, drawScene, resetHighResState } from './renderer.js';
import { toggleSidebar, selectApartment } from './ui.js';

const container = document.getElementById('container-360');
const colorIdDisplay = document.getElementById('color-id');
const tooltip = document.getElementById('apartment-tooltip');

// 1. Deklarujemy hasDragged na poziomie modułu, aby wszystkie funkcje miały do niej dostęp
let hasDragged = false;
let dragStartX = 0;
let dragStartY = 0;

// [USUNIĘTO]: Cały luźny `container.addEventListener('click', ...)` z tego miejsca!

export function rotateToDirection(targetFrame) {
    if (state.isAnimating || state.isDragging) return;

    if (tooltip) tooltip.classList.add('hidden');

    resetHighResState();

    state.isAnimating = true;

    const highlightCanvas = document.getElementById('highlight-canvas');
    const highlightCtx = highlightCanvas ? highlightCanvas.getContext('2d') : null;

    if (highlightCanvas && highlightCtx) {
        highlightCanvas.style.transition = 'none';
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

            drawScene();
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
        resetHighResState();

        const frameShift = Math.floor(deltaX / state.sensitivity);
        state.currentFrame += frameShift;

        if (state.currentFrame > state.totalFrames) state.currentFrame -= state.totalFrames;
        else if (state.currentFrame < 1) state.currentFrame += state.totalFrames;

        updateFrames();
        state.startX = clientX;
    }
}

export function initControls() {
    if (!container) return;

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
            
            // Jeśli faktycznie obracaliśmy, zerujemy pozycję klastra hover, 
            // aby uniknąć przypadkowego podświetlenia mieszkania w miejscu puszczenia
            if (hasDragged) {
                state.mouseX = -1;
                state.mouseY = -1;
            }
            
            drawScene();
        }
    });

    window.addEventListener('mouseleave', () => {
        state.isDragging = false;
        drawScene();
    });

    window.addEventListener('mousemove', (e) => {
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

    // JEDYNE I PRAWIDŁOWE MIEJSCE OBSŁUGI KLIKNIĘCIA
    container.addEventListener('click', (e) => {
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

            // Na telefonie po zakończeniu obrotu zerujemy dotyk – palec został odjęty od ekranu!
            // Dzięki temu mieszkanie pod palcem NIE podświetli się po puszczeniu obrotu.
            if (hasDragged) {
                state.mouseX = -1;
                state.mouseY = -1;
            }

            drawScene();
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

function initFullscreen() {
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const container360 = document.getElementById('container-360');

    if (!btnFullscreen || !container360) return;

    btnFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();

        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
            if (container360.requestFullscreen) container360.requestFullscreen();
            else if (container360.webkitRequestFullscreen) container360.webkitRequestFullscreen();
            else if (container360.msRequestFullscreen) container360.msRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
    });

    const handleFullscreenChange = () => {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        const iconEnter = btnFullscreen.querySelector('.icon-fullscreen-enter');
        const iconExit = btnFullscreen.querySelector('.icon-fullscreen-exit');

        if (isFullscreen) {
            if (iconEnter) iconEnter.classList.add('hidden');
            if (iconExit) iconExit.classList.remove('hidden');
        } else {
            if (iconEnter) iconEnter.classList.remove('hidden');
            if (iconExit) iconExit.classList.add('hidden');
        }

        setTimeout(() => drawScene(), 150);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    btnFullscreen.addEventListener('mousedown', (e) => e.stopPropagation());
    btnFullscreen.addEventListener('mouseup', (e) => e.stopPropagation());
}

export function switchMode(mode) {
    console.log("Przełączanie trybu na: ", mode);

    state.currentMode = mode;

    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }

    const containerMakieta = document.getElementById('container-360');
    const containerWalk = document.getElementById('container-walk');
    const legendBox = document.getElementById('legend-box');
    const statusBtn = document.getElementById('btn-toggle-legend');

    if (mode === 'walk') {
        resetHighResState();

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

        setTimeout(() => {
            if (typeof initPanorama === 'function') {
                initPanorama();
            }
        }, 100);

    } else if (mode === 'makieta') {
        if (containerWalk) containerWalk.classList.add('hidden');
        if (containerMakieta) containerMakieta.classList.remove('hidden');

        if (legendBox) legendBox.classList.add('hidden');
        if (statusBtn) statusBtn.classList.remove('active');

        if (window.viewer && typeof window.viewer.destroy === 'function') {
            window.viewer.destroy();
            window.viewer = null;
        }

        resetHighResState();

        setTimeout(() => {
            drawScene();
        }, 100);
    }
}