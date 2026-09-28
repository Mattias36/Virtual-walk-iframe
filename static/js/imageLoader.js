import { state } from './state.js';
import { drawScene, updateFrames } from './renderer.js';

export function padNumber(num) {
    return num.toString().padStart(4, '0');
}

function loadImage(src, callback) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            if (callback) callback();
            resolve(img);
        };
        img.onerror = () => {
            console.warn(`[360 Viewer] Błąd ładowania: ${src}`);
            if (callback) callback();
            resolve(null);
        };
        img.src = src;
    });
}

function updateLoadingProgress() {
    const progressElement = document.getElementById('loading-progress');
    const textElement = document.getElementById('loading-text');
    const totalAssets = state.totalFrames * 2;
    const loadedAssets = state.loadedBuildingCount + state.loadedMasksCount;

    if (progressElement) progressElement.value = loadedAssets;
    if (textElement) {
        textElement.textContent = `Ładowanie makiety: ${Math.round((loadedAssets / totalAssets) * 100)}%`;
    }
}

// 1. Ładowanie makiety Z BLISKA (zdjęcia FHD + maski)
export async function preloadAllFrames() {
    console.log("Rozpoczynam buforowanie zdjęć Z BLISKA...");
    const BATCH_SIZE = 6; 
    updateLoadingProgress();

    // Zmiana: j < state.totalFrames zamiast <=
    for (let i = 0; i < state.totalFrames; i += BATCH_SIZE) {
        const batchPromises = [];

        for (let j = i; j < i + BATCH_SIZE && j < state.totalFrames; j++) {
            const frameStr = padNumber(j);
            const pathBuilding = `./static/MovieRenders/zdjecia_fhd/NewLevelSequence.${frameStr}.jpg`;
            const pathMask = `./static/MovieRenders/Maski/Maski_rendery.${frameStr}.png`;

            const bPromise = loadImage(pathBuilding, () => {
                state.loadedBuildingCount++;
                updateLoadingProgress();
            })
                .then(img => {
                    state.imagesBuildingCache[j] = img;
                    if (img && j === state.currentFrame && state.viewType === 'near') {
                        drawScene();
                    }
                });

            const mPromise = loadImage(pathMask, () => {
                state.loadedMasksCount++;
                updateLoadingProgress();
            })
                .then(img => { state.imagesMasksCache[j] = img; });

            batchPromises.push(bPromise, mPromise);
        }
        await Promise.all(batchPromises);
    }
    state.isMakietaReady = true;
    console.log("Klatki Z BLISKA załadowane.");
    document.getElementById('loading-indicator')?.classList.add('hidden');

    // Pierwszy render po zakończeniu ładowania, bez oczekiwania na ruch myszy.
    updateFrames();

    preloadFarFrames()
}

export async function preloadFarFrames() {
    console.log("Rozpoczynam buforowanie zdjęć Z DALEKA w tle...");
    const BATCH_SIZE = 6;

    // Zmiana: j < state.totalFrames zamiast <=
    for (let i = 0; i < state.totalFrames; i += BATCH_SIZE) {
        const batchPromises = [];

        for (let j = i; j < i + BATCH_SIZE && j < state.totalFrames; j++) {
            // Zamiana indexu 0..119 na numery plików 120..239
            const fileNumber = j + 120;
            const frameStr = padNumber(fileNumber);
            const pathFar = `./static/MovieRenders/zdjecia_fhd_z_daleka/NewLevelSequence.${frameStr}.jpg`;

            const fPromise = loadImage(pathFar, () => state.loadedFarCount++)
                .then(img => { state.imagesFarCache[j] = img; });

            batchPromises.push(fPromise);
        }
        await Promise.all(batchPromises);
    }

    state.isFarReady = true;
    console.log("Klatki Z DALEKA załadowane do pamięci RAM!");
}