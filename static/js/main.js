// js/main.js

import { loadApartmentsFromExcel } from './data.js?v=20261007';
import { preloadAllFrames } from './imageLoader.js?v=20261007';
import { initControls, rotateToDirection, switchMode, changeZoom, centerFarView, toggleFarMap } from './controls.js?v=20261007';
import { toggleSidebar, selectApartment, toggleLegend } from './ui.js?v=20261007';
import { state } from './state.js?v=20261007';
import { toggleViewType } from './navigation.js?v=20261007'; // 1. IMPORT NOWEJ FUNKCJI

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

let mobilePdfDocument = null;
let mobilePdfRenderTask = null;
let mobilePdfFitScale = 1;
let mobilePdfScale = 1;
let mobilePdfPageNumber = 1;
let mobilePdfRequestId = 0;
let mobilePdfRenderId = 0;

function isMobilePdfViewport() {
    return window.matchMedia('(max-width: 960px), (orientation: landscape) and (max-height: 600px)').matches && window.pdfjsLib;
}

async function renderMobilePdfPage(fitPage = false) {
    if (!mobilePdfDocument) return;

    const viewportElement = document.getElementById('apartment-pdf-viewport');
    const canvas = document.getElementById('apartment-pdf-canvas');
    const pageLabel = document.getElementById('apartment-pdf-page');
    const zoomLabel = document.getElementById('apartment-pdf-zoom');
    const previousButton = document.getElementById('apartment-pdf-prev');
    const nextButton = document.getElementById('apartment-pdf-next');
    if (!viewportElement || !canvas) return;

    const renderId = ++mobilePdfRenderId;
    if (mobilePdfRenderTask) {
        mobilePdfRenderTask.cancel();
        mobilePdfRenderTask = null;
    }

    const page = await mobilePdfDocument.getPage(mobilePdfPageNumber);
    if (renderId !== mobilePdfRenderId) return;

    const baseViewport = page.getViewport({ scale: 1 });
    if (fitPage || !mobilePdfFitScale) {
        const fitWidth = Math.max(1, viewportElement.clientWidth - 24) / baseViewport.width;
        const fitHeight = Math.max(1, viewportElement.clientHeight - 24) / baseViewport.height;
        mobilePdfFitScale = Math.min(fitWidth, fitHeight);
        mobilePdfScale = mobilePdfFitScale;
    }

    const pageViewport = page.getViewport({ scale: mobilePdfScale });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(pageViewport.width * outputScale);
    canvas.height = Math.ceil(pageViewport.height * outputScale);
    canvas.style.width = `${pageViewport.width}px`;
    canvas.style.height = `${pageViewport.height}px`;

    if (pageLabel) pageLabel.textContent = `${mobilePdfPageNumber} / ${mobilePdfDocument.numPages}`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round((mobilePdfScale / mobilePdfFitScale) * 100)}%`;
    if (previousButton) previousButton.disabled = mobilePdfPageNumber <= 1;
    if (nextButton) nextButton.disabled = mobilePdfPageNumber >= mobilePdfDocument.numPages;

    const context = canvas.getContext('2d');
    mobilePdfRenderTask = page.render({
        canvasContext: context,
        viewport: pageViewport,
        transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0]
    });

    try {
        await mobilePdfRenderTask.promise;
    } catch (error) {
        if (error.name !== 'RenderingCancelledException') throw error;
    } finally {
        if (renderId === mobilePdfRenderId) mobilePdfRenderTask = null;
    }
}

async function openMobileApartmentPdf(url) {
    const requestId = ++mobilePdfRequestId;
    const viewer = document.getElementById('apartment-pdf-mobile');
    const iframe = document.getElementById('apartment-pdf-frame');
    if (!viewer || !iframe || !window.pdfjsLib) return false;

    viewer.classList.remove('hidden');
    iframe.classList.add('hidden');
    mobilePdfDocument?.destroy();
    mobilePdfDocument = null;
    mobilePdfFitScale = 1;
    mobilePdfScale = 1;
    mobilePdfPageNumber = 1;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    try {
        const pdfDocument = await window.pdfjsLib.getDocument(url).promise;
        if (requestId !== mobilePdfRequestId) {
            pdfDocument.destroy();
            return true;
        }
        mobilePdfDocument = pdfDocument;
        await renderMobilePdfPage(true);
        return true;
    } catch (error) {
        if (requestId === mobilePdfRequestId) {
            console.warn('[PDF] Mobilny podgląd nie zadziałał, używam podglądu przeglądarki.', error);
            viewer.classList.add('hidden');
            iframe.classList.remove('hidden');
            iframe.src = `${url}#toolbar=1&navpanes=0&view=Fit`;
        }
        return true;
    }
}

function initMobilePdfControls() {
    document.getElementById('apartment-pdf-prev')?.addEventListener('click', () => {
        if (!mobilePdfDocument || mobilePdfPageNumber <= 1) return;
        mobilePdfPageNumber--;
        renderMobilePdfPage(true);
    });
    document.getElementById('apartment-pdf-next')?.addEventListener('click', () => {
        if (!mobilePdfDocument || mobilePdfPageNumber >= mobilePdfDocument.numPages) return;
        mobilePdfPageNumber++;
        renderMobilePdfPage(true);
    });
    document.getElementById('apartment-pdf-fit')?.addEventListener('click', () => renderMobilePdfPage(true));
    document.getElementById('apartment-pdf-zoom-out')?.addEventListener('click', () => {
        if (!mobilePdfDocument) return;
        mobilePdfScale = Math.max(mobilePdfFitScale, mobilePdfScale / 1.25);
        renderMobilePdfPage();
    });
    document.getElementById('apartment-pdf-zoom-in')?.addEventListener('click', () => {
        if (!mobilePdfDocument) return;
        mobilePdfScale = Math.min(mobilePdfFitScale * 4, mobilePdfScale * 1.25);
        renderMobilePdfPage();
    });
    window.addEventListener('resize', () => {
        if (mobilePdfDocument && isMobilePdfViewport()) {
            requestAnimationFrame(() => renderMobilePdfPage(true));
        }
    });
}

function openApartmentPanel() {
    const apartment = state.selectedApartment;
    const panel = document.getElementById('apartment-panel');
    const iframe = document.getElementById('apartment-pdf-frame');
    const title = document.getElementById('apartment-panel-title');

    if (!apartment || !apartment.url || !panel || !iframe || !title) {
        return;
    }

    title.textContent = apartment.name || 'Karta lokalu';

    requestAnimationFrame(() => {
        panel.classList.remove('hidden');
        document.body.classList.add('apartment-panel-open');
        if (isMobilePdfViewport()) {
            openMobileApartmentPdf(apartment.url);
        } else {
            document.getElementById('apartment-pdf-mobile')?.classList.add('hidden');
            iframe.classList.remove('hidden');
            iframe.src = apartment.url + '#toolbar=1&navpanes=0&view=Fit';
        }
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
        iframe.classList.remove('hidden');
    }

    mobilePdfRequestId++;
    mobilePdfRenderTask?.cancel();
    mobilePdfRenderTask = null;
    mobilePdfDocument?.destroy();
    mobilePdfDocument = null;
    document.getElementById('apartment-pdf-mobile')?.classList.add('hidden');
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
    initMobilePdfControls();
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