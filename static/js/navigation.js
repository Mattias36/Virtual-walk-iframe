import { state } from './state.js';
import { updateFrames, drawScene } from './renderer.js';
import { resetZoom } from './controls.js';

export function toggleViewType() {
    const statusBtn = document.getElementById('btn-toggle-legend');
    const legendBox = document.getElementById('legend-box');
    const btnText = document.getElementById('btn-view-text');
    const btnIcon = document.getElementById('btn-view-icon'); // Pobieramy obrazek ikonki
    const tooltip = document.getElementById('apartment-tooltip');
    const sidebarContainer = document.getElementById('sidebar-container');
    const highlightCanvas = document.getElementById('highlight-canvas');
    const highlightCtx = highlightCanvas ? highlightCanvas.getContext('2d') : null;
    const zoomControls = document.getElementById('far-zoom-controls');

    // Adresy ikon Zoom Out / Zoom In
    const iconZoomOut = "https://icons.iconarchive.com/icons/aniket-suvarna/box/128/bxs-zoom-out-icon.png";
    const iconZoomIn = "https://icons.iconarchive.com/icons/aniket-suvarna/box/128/bxs-zoom-in-icon.png";

    if (state.viewType === 'near') {
        state.viewType = 'far';
        state.showAllStatuses = false;
        if (zoomControls) zoomControls.classList.remove('hidden');

        // 1. Ukrywamy przycisk statusów oraz legendę i tooltip
        if (statusBtn) {
            statusBtn.classList.add('hidden');
            statusBtn.classList.remove('active');
            statusBtn.style.setProperty('display', 'none', 'important');
        }
        
        if (legendBox) legendBox.classList.add('hidden');
        if (tooltip) tooltip.classList.add('hidden');
        
        // Zmiana tekstu i ikonki na Widok z bliska (Zoom In)
        if (btnText) btnText.textContent = 'Widok z bliska';
        if (btnIcon) btnIcon.src = iconZoomIn;

        // 2. Ukrywamy sidebar i przycisk toggle-sidebar
        if (sidebarContainer) {
            sidebarContainer.classList.add('hidden');
            sidebarContainer.style.setProperty('display', 'none', 'important');
        }

        // 3. Czyścimy podświetlenia z płótna
        if (highlightCanvas && highlightCtx) {
            highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
            highlightCanvas.className = '';
        }
        
    } else {
        state.viewType = 'near';
        resetZoom();
        if (zoomControls) zoomControls.classList.add('hidden');

        // Przywracamy przycisk statusów
        if (statusBtn) {
            statusBtn.classList.remove('hidden');
            statusBtn.style.display = '';
        }

        // Przywracamy sidebar i przycisk toggle-sidebar
        if (sidebarContainer) {
            sidebarContainer.classList.remove('hidden');
            sidebarContainer.style.display = '';
        }
        
        // Zmiana tekstu i ikonki na Widok z daleka (Zoom Out)
        if (btnText) btnText.textContent = 'Widok z daleka';
        if (btnIcon) btnIcon.src = iconZoomOut;
    }

    updateFrames();
    drawScene();
}

window.toggleViewType = toggleViewType;