import { state, maskCanvas, maskCtx } from './state.js';
import { padNumber } from './imageLoader.js';

const canvas = document.getElementById('main-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const highlightCanvas = document.getElementById('highlight-canvas');
const highlightCtx = highlightCanvas ? highlightCanvas.getContext('2d') : null;

const frameCounter = document.getElementById('frame-counter');
const colorIdDisplay = document.getElementById('color-id');
const container = document.getElementById('container-360');
const tooltip = document.getElementById('apartment-tooltip');

export function updateFrames() {
    if (state.viewType === 'near' && !state.isMakietaReady) return;
    if (state.viewType === 'far' && !state.isFarReady) return;

    // Automatyczne chowanie sidebaru przy wejściu w widok 'far'
    if (state.viewType === 'far') {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer && sidebarContainer.classList.contains('open')) {
            sidebarContainer.classList.remove('open');
        }
    }

    // Bezpieczny indeks w przedziale 0..119
    const safeFrame = state.currentFrame % state.totalFrames;

    // Przesunięcie numeryczne wyświetlania dla celów weryfikacyjnych (spójne +120)
    const currentFileNumber = state.viewType === 'far' ? (safeFrame + 120) : safeFrame;
    const frameStr = padNumber(currentFileNumber);

    if (frameCounter) frameCounter.textContent = frameStr;

    if (state.viewType === 'far') {
        state.imgBuilding = state.imagesFarCache[safeFrame];
        state.imgMask = null; // wyłączenie masek
    } else {
        state.imgBuilding = state.imagesBuildingCache[safeFrame];
        state.imgMask = state.imagesMasksCache[safeFrame];
    }

    drawScene();
}

let load4kTimeout = null;
let current4kImage = null;
let current4kFrameIndex = null;
let current4kViewType = null;

function getHighResPath(frameIndex) {
    if (state.viewType === 'far') {
        // Zgodna numeracja 0..119 -> 120..239
        const fileNumber = frameIndex + 120;
        const paddedIndex = String(fileNumber).padStart(4, '0');
        return `./static/MovieRenders/Uj_z_daleka/NewLevelSequence.${paddedIndex}.avif`;
    } else {
        // Dla widoku z bliska (0000 -> 0119)
        const paddedIndex = String(frameIndex).padStart(4, '0');
        return `./static/MovieRenders/Uj_z_bliska/NewLevelSequence.${paddedIndex}.avif`;
    }
}

function isHighResBlocked() {
    const sidebarContainer = document.getElementById('sidebar-container');
    const isSidebarOpen = sidebarContainer && sidebarContainer.classList.contains('open');
    return state.currentMode === 'walk' || isSidebarOpen || state.showAllStatuses;
}

export function clear4kState() {
    if (load4kTimeout) {
        clearTimeout(load4kTimeout);
        load4kTimeout = null;
    }
    if (current4kImage) {
        current4kImage.src = '';
    }
    current4kImage = null;
    current4kFrameIndex = null;
    current4kViewType = null;
}

export function scheduleHighResLoad(frameIndex) {
    if (isHighResBlocked()) {
        clear4kState();
        return;
    }

    // Gwarancja cyklicznego zakresu 0..119
    const safeFrameIndex = ((frameIndex % state.totalFrames) + state.totalFrames) % state.totalFrames;

    if (current4kFrameIndex === safeFrameIndex && current4kViewType === state.viewType && current4kImage) return;

    if (load4kTimeout) clearTimeout(load4kTimeout);

    load4kTimeout = setTimeout(() => {
        if (isHighResBlocked()) {
            clear4kState();
            return;
        }

        const requestedView = state.viewType;
        const targetPath = getHighResPath(safeFrameIndex);

        console.log(`[4K Loader] Planowanie pobierania (${requestedView}):`, targetPath);

        const img4k = new Image();

        // 1. Zdarzenie SUKCESU
        img4k.onload = () => {
            const currentSafeFrame = ((state.currentFrame % state.totalFrames) + state.totalFrames) % state.totalFrames;
            
            if (
                !isHighResBlocked() &&
                !state.isDragging &&
                !state.isAnimating &&
                currentSafeFrame === safeFrameIndex &&
                state.viewType === requestedView
            ) {
                current4kImage = img4k;
                current4kFrameIndex = safeFrameIndex;
                current4kViewType = requestedView;

                console.log(`%c[4K Loader] SUKCES! Obraz 4K (${requestedView}) dla klatki ${safeFrameIndex} wczytany i wyświetlony.`, 'color: #00ff00; font-weight: bold;');

                drawScene();
            } else {
                console.log(`[4K Loader] Pobrano 4K, ale odrzucono (nastąpiła zmiana klatki/trybu).`);
            }
        };

        // 2. Zdarzenie BŁĘDU
        img4k.onerror = () => {
            console.error(`[4K Loader] BŁĄD! Nie znaleziono pliku 4K pod ścieżką: ${targetPath}`);
        };

        // 3. Przypisanie ścieżki
        img4k.src = targetPath;
    }, 200);
}

export function resetHighResState() {
    clear4kState();
}

export function drawScene() {
    if (state.currentMode === 'walk') return;

    // Bezpieczne sprowadzenie do indeksu 0..119
    const safeFrame = ((state.currentFrame % state.totalFrames) + state.totalFrames) % state.totalFrames;

    // 1. Pobranie odpowiedniego obrazu FHD
    const baseImg = state.viewType === 'far'
        ? state.imagesFarCache[safeFrame]
        : state.imagesBuildingCache[safeFrame];

    if (!baseImg || !baseImg.complete || baseImg.naturalWidth === 0) {
        console.warn(`[360 Viewer] Brak klatki ${safeFrame} dla trybu: ${state.viewType}`);
        return;
    }

    state.imgBuilding = baseImg;

    // 2. Ładowanie 4K
    const isUsing4k = !isHighResBlocked() &&
        !state.isDragging &&
        !state.isAnimating &&
        current4kImage &&
        current4kImage.complete &&
        current4kImage.naturalWidth > 0 &&
        current4kFrameIndex === safeFrame &&
        current4kViewType === state.viewType;

    const activeBuildingImg = isUsing4k ? current4kImage : state.imgBuilding;

    // 3. Rozmiar Canvasu
    const targetWidth = activeBuildingImg.naturalWidth || 1920;
    const targetHeight = activeBuildingImg.naturalHeight || 1080;

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        if (highlightCanvas) {
            highlightCanvas.width = targetWidth;
            highlightCanvas.height = targetHeight;
        }
        maskCanvas.width = targetWidth;
        maskCanvas.height = targetHeight;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 4. RYSOWANIE OBRAZU WŁAŚCIWEGO
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(activeBuildingImg, 0, 0, canvas.width, canvas.height);

    // 5. OBSŁUGA OBRACANIA (DRAG)
    if (state.isDragging) {
        resetHighResState();
        if (colorIdDisplay) {
            colorIdDisplay.textContent = "Obracanie...";
            colorIdDisplay.style.color = "#aaa";
        }
        if (tooltip) tooltip.classList.add('hidden');
        if (highlightCtx && highlightCanvas) {
            highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
            highlightCanvas.className = '';
        }
        return;
    }

    // 6. BLOKADA INTERAKCJI DLA TRYBU 'FAR'
    if (state.viewType === 'far') {
        scheduleHighResLoad(safeFrame);
    
        container.style.cursor = 'grab';
        state.canDrag = true;
        if (tooltip) tooltip.classList.add('hidden');
        if (colorIdDisplay) {
            colorIdDisplay.textContent = `Widok z daleka (Klatka ${safeFrame})`;
            colorIdDisplay.style.color = "#88ccff";
        }
        if (highlightCtx && highlightCanvas) {
            highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
            highlightCanvas.className = '';
        }
        return;
    }

    // 7. OBSŁUGA MASKI I INTERAKCJE DLA TRYBU 'NEAR'
    scheduleHighResLoad(safeFrame);

    let targetR = null, targetG = null, targetB = null;
    let targetStatus = 'Dostępne';
    let currentApt = null;

    if (state.imagesMasksCache[safeFrame]) {
        state.imgMask = state.imagesMasksCache[safeFrame];
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.drawImage(state.imgMask, 0, 0, maskCanvas.width, maskCanvas.height);

        container.style.cursor = 'grab';
        state.canDrag = true;

        // Wykrywanie punktu pod kursor/dotykiem
        if (!state.isAnimating && !state.isDragging && state.mouseX > 0 && state.mouseY > 0) {
            const rect = canvas.getBoundingClientRect();
            const imgRatio = canvas.width / canvas.height;
            const containerRatio = rect.width / rect.height;

            let renderWidth, renderHeight, offsetX = 0, offsetY = 0;
            if (containerRatio > imgRatio) {
                renderWidth = rect.width;
                renderHeight = rect.width / imgRatio;
                offsetY = (rect.height - renderHeight) / 2;
            } else {
                renderHeight = rect.height;
                renderWidth = rect.height * imgRatio;
                offsetX = (rect.width - renderWidth) / 2;
            }

            const relativeMouseX = state.mouseX - rect.left - offsetX;
            const relativeMouseY = state.mouseY - rect.top - offsetY;

            const canvasX = Math.floor(relativeMouseX * (canvas.width / renderWidth));
            const canvasY = Math.floor(relativeMouseY * (canvas.height / renderHeight));

            if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
                try {
                    const pixel = maskCtx.getImageData(canvasX, canvasY, 1, 1).data;
                    const r = pixel[0], g = pixel[1], b = pixel[2], a = pixel[3];
                    const isDark = (r < 113 && g < 113 && b < 113);
                    const isBackground = isDark || (a !== undefined && a < 10);

                    if (!isBackground) {
                        container.style.cursor = 'pointer';

                        if (colorIdDisplay) {
                            colorIdDisplay.textContent = `Wykryto segment RGB(${r},${g},${b})`;
                            colorIdDisplay.style.color = "#ff9500";
                        }

                        const TOLERANCE = 2;
                        currentApt = state.colorLinks.find(item =>
                            Math.abs(item.r - r) <= TOLERANCE &&
                            Math.abs(item.g - g) <= TOLERANCE &&
                            Math.abs(item.b - b) <= TOLERANCE
                        );
                    } else if (colorIdDisplay) {
                        colorIdDisplay.textContent = "Brak";
                        colorIdDisplay.style.color = "#fff";
                    }
                } catch (e) {
                    console.error("Błąd maski:", e);
                }
            }
        }

        state.hoveredApartment = currentApt ? currentApt.id : null;

        const sidebar = document.getElementById('apartment-sidebar');
        const isSidebarOpen = sidebar && sidebar.classList.contains('open');

        const activeApt = state.selectedApartment;

        if (state.showAllStatuses) {
            if (colorIdDisplay) {
                colorIdDisplay.textContent = "Podświetlenie statusów (Legenda)";
                colorIdDisplay.style.color = "#00ff00";
            }
            if (tooltip) tooltip.classList.add('hidden');
        } else if (activeApt) {
            targetR = activeApt.r;
            targetG = activeApt.g;
            targetB = activeApt.b;
            targetStatus = activeApt.status;
        } else if (!state.selectedApartment) {
            if (tooltip) tooltip.classList.add('hidden');
        }
    }

    // 8. RYSOWANIE PODŚWIETLENIA MASKI
    renderHighlights(targetR, targetG, targetB, targetStatus);
}

let cachedLegendFrame = null;
let cachedLegendImageData = null;

function renderHighlights(targetR, targetG, targetB, targetStatus) {
    if (state.currentMode === 'walk' || state.isAnimating || state.viewType === 'far') {
        if (highlightCtx && highlightCanvas) {
            highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
            highlightCanvas.className = '';
        }
        return;
    }

    if (!highlightCtx || !highlightCanvas) return;
    const TOLERANCE = 2;

    const safeFrame = ((state.currentFrame % state.totalFrames) + state.totalFrames) % state.totalFrames;

    if (state.showAllStatuses) {
        highlightCanvas.className = 'active';
        clear4kState();
        try {
            if (cachedLegendFrame === safeFrame && cachedLegendImageData) {
                highlightCtx.putImageData(cachedLegendImageData, 0, 0);
                return;
            }

            const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
            const data = maskData.data;
            const highlightData = highlightCtx.createImageData(highlightCanvas.width, highlightCanvas.height);
            const hData = highlightData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                if (a < 10 || (r === 0 && g === 0 && b === 0)) continue;

                const apt = state.colorLinks.find(item =>
                    Math.abs(item.r - r) <= TOLERANCE &&
                    Math.abs(item.g - g) <= TOLERANCE &&
                    Math.abs(item.b - b) <= TOLERANCE
                );

                if (apt) {
                    const s = (apt.status || '').toLowerCase();
                    if (s.includes('rez')) {
                        hData[i] = 255; hData[i + 1] = 165; hData[i + 2] = 0; hData[i + 3] = 110;
                    } else if (s.includes('sprzed')) {
                        hData[i] = 255; hData[i + 1] = 50; hData[i + 2] = 50; hData[i + 3] = 110;
                    } else {
                        hData[i] = 0; hData[i + 1] = 255; hData[i + 2] = 0; hData[i + 3] = 110;
                    }
                }
            }
            cachedLegendImageData = highlightData;
            cachedLegendFrame = safeFrame;
            highlightCtx.putImageData(highlightData, 0, 0);

        } catch (e) {
            console.error("Błąd podświetlenia legendy:", e);
        }
    } else if (targetR !== null && targetG !== null && targetB !== null) {
        cachedLegendFrame = null;
        cachedLegendImageData = null;
        highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);

        try {
            const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
            const data = maskData.data;

            let rFill = 0, gFill = 255, bFill = 0;
            const s = (targetStatus || '').toLowerCase();
            if (s.includes('rez')) {
                rFill = 255; gFill = 165; bFill = 0;
            } else if (s.includes('sprzed')) {
                rFill = 255; gFill = 50; bFill = 50;
            }

            const highlightData = highlightCtx.createImageData(highlightCanvas.width, highlightCanvas.height);
            const hData = highlightData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (Math.abs(data[i] - targetR) <= TOLERANCE &&
                    Math.abs(data[i + 1] - targetG) <= TOLERANCE &&
                    Math.abs(data[i + 2] - targetB) <= TOLERANCE) {

                    hData[i] = rFill;
                    hData[i + 1] = gFill;
                    hData[i + 2] = bFill;
                    hData[i + 3] = 110;
                }
            }
            highlightCtx.putImageData(highlightData, 0, 0);
            highlightCanvas.className = 'active';
        } catch (e) {
            console.error("Błąd podświetlenia lokalu:", e);
        }
    } else {
        cachedLegendFrame = null;
        cachedLegendImageData = null;
        highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
        highlightCanvas.className = '';
    }
}

export function getApartmentCenterCoords(apartment) {
    const safeFrame = ((state.currentFrame % state.totalFrames) + state.totalFrames) % state.totalFrames;
    const maskImage = state.imagesMasksCache[safeFrame];
    if (state.viewType === 'far' || !maskImage || !maskImage.complete || maskImage.naturalWidth === 0) return null;

    const width = maskCanvas.width;
    const height = maskCanvas.height;
    const maskData = maskCtx.getImageData(0, 0, width, height).data;
    const tolerance = 2;

    let sumX = 0, sumY = 0, count = 0;

    for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
            const idx = (y * width + x) * 4;
            if (Math.abs(maskData[idx] - apartment.r) < tolerance &&
                Math.abs(maskData[idx + 1] - apartment.g) < tolerance &&
                Math.abs(maskData[idx + 2] - apartment.b) < tolerance) {
                sumX += x; sumY += y; count++;
            }
        }
    }

    if (count === 0) return null;

    const avgX = sumX / count;
    const avgY = sumY / count;
    const rect = canvas.getBoundingClientRect();
    const imgRatio = canvas.width / canvas.height;
    const containerRatio = rect.width / rect.height;

    let renderWidth, renderHeight, offsetX = 0, offsetY = 0;
    if (containerRatio > imgRatio) {
        renderWidth = rect.width; renderHeight = rect.width / imgRatio;
        offsetY = (rect.height - renderHeight) / 2;
    } else {
        renderHeight = rect.height; renderWidth = rect.height * imgRatio;
        offsetX = (rect.width - renderWidth) / 2;
    }

    return {
        x: offsetX + (avgX / canvas.width) * renderWidth,
        y: offsetY + (avgY / canvas.height) * renderHeight
    };
}