// js/main.js

import { loadApartmentsFromExcel } from './data.js';
import { preloadAllFrames } from './imageLoader.js';
import { initControls, rotateToDirection, switchMode, changeZoom, centerFarView, toggleFarMap } from './controls.js';
import { toggleSidebar, selectApartment, toggleLegend } from './ui.js';
import { state } from './state.js';
import { toggleViewType } from './navigation.js'; // 1. IMPORT NOWEJ FUNKCJI

// ==========================================================================
// MOSTEK DLA HTML (Wystawienie funkcji do okna globalnego)
// ==========================================================================
window.rotateToDirection = rotateToDirection;
window.switchMode = switchMode;
window.toggleSidebar = toggleSidebar;
window.selectApartment = selectApartment;
window.toggleLegend = toggleLegend;
window.toggleViewType = toggleViewType; // 2. WYSTAWIENIE DO WINDOW
window.changeZoom = changeZoom;
window.centerFarView = centerFarView;
window.toggleFarMap = toggleFarMap;
window.state = state

function openApartmentPanel() {
    const apartment = state.selectedApartment;
    const panel = document.getElementById('apartment-panel');
    const iframe = document.getElementById('apartment-pdf-frame');
    const title = document.getElementById('apartment-panel-title');

    if (!apartment || !apartment.url || !panel || !iframe || !title) {
        return;
    }

    title.textContent = apartment.name || 'Karta lokalu';
    iframe.src = apartment.url + '#toolbar=0';

    requestAnimationFrame(() => {
        panel.classList.remove('hidden');
        document.body.classList.add('apartment-panel-open');
    });
}

function closeApartmentPanel() {
    const panel = document.getElementById('apartment-panel');
    const iframe = document.getElementById('apartment-pdf-frame');

    if (panel) {
        panel.classList.add('hidden');
    }

    if (iframe) {
        iframe.src = '';
    }

    document.body.classList.remove('apartment-panel-open');
}

window.goToApartmentUrl = function() {
    openApartmentPanel();
};
window.closeApartmentPanel = closeApartmentPanel;

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const panel = document.getElementById('apartment-panel');
        if (panel && !panel.classList.contains('hidden')) {
            closeApartmentPanel();
        }
    }
});

// ==========================================================================
// INICJALIZACJA APLIKACJI
// ==========================================================================
function initApp() {
    loadApartmentsFromExcel();
    preloadAllFrames();
    initControls();
    initTouchButtonFeedback();

    // Nasłuchiwanie na przycisk legendy
    const btnToggleLegend = document.getElementById('btn-toggle-legend');
    if (btnToggleLegend) {
        btnToggleLegend.addEventListener('click', toggleLegend);
    }

    // 3. Nasłuchiwanie na przycisk zmiany widoku (Blisko / Daleko)
    // const btnToggleView = document.getElementById('btn-toggle-view');
    // if (btnToggleView) {
    //     btnToggleView.addEventListener('click', toggleViewType);
    // }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
    initApp();
}

function bindTouchFeedback(element) {
    if (!element || element.dataset.touchFeedbackBound === 'true') {
        return;
    }

    element.dataset.touchFeedbackBound = 'true';
    let feedbackTimeout;

    element.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch') return;

        document.body.classList.add('touch-device');
        clearTimeout(feedbackTimeout);
        element.classList.add('touch-active');
    });

    const clearFeedback = () => {
        clearTimeout(feedbackTimeout);
        feedbackTimeout = setTimeout(() => {
            element.classList.remove('touch-active');
            if (typeof element.blur === 'function') {
                element.blur();
            }
        }, 180);
    };

    element.addEventListener('pointerup', clearFeedback);
    element.addEventListener('pointercancel', clearFeedback);
    element.addEventListener('click', clearFeedback);
    element.addEventListener('pointerleave', () => {
        clearTimeout(feedbackTimeout);
        element.classList.remove('touch-active');
    });
}

function initTouchButtonFeedback() {
    const selector = 'button, .pnlm-zoom-in, .pnlm-zoom-out, .pnlm-fullscreen-toggle-button, .pnlm-hotspot-base.pnlm-scene';

    const attachExisting = () => {
        document.querySelectorAll(selector).forEach(bindTouchFeedback);
    };

    attachExisting();

    const observer = new MutationObserver(() => {
        attachExisting();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}