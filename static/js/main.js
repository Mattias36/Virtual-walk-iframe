// js/main.js

import { loadApartmentsFromExcel } from './data.js';
import { preloadAllFrames } from './imageLoader.js';
import { initControls, rotateToDirection, switchMode } from './controls.js';
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
window.state = state

window.goToApartmentUrl = function() {
    if (state.selectedApartment && state.selectedApartment.url) {
        window.location.href = state.selectedApartment.url;
    }
};

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

function initTouchButtonFeedback() {
    document.querySelectorAll('button').forEach(button => {
        let feedbackTimeout;

        button.addEventListener('pointerdown', event => {
            if (event.pointerType !== 'touch') return;

            document.body.classList.add('touch-device');
            clearTimeout(feedbackTimeout);
            button.classList.add('touch-active');
        });

        const clearFeedback = () => {
            clearTimeout(feedbackTimeout);
            feedbackTimeout = setTimeout(() => {
                button.classList.remove('touch-active');
                button.blur();
            }, 180);
        };

        button.addEventListener('pointerup', clearFeedback);
        button.addEventListener('pointercancel', clearFeedback);
    });
}