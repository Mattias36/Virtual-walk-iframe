// Globalny stan (spójny dla wszystkich modułów)
export const state = {
    currentMode: 'makieta', // 'makieta' | 'walk'
    viewType: 'near',
    zoom: 1,
    panX: 0,
    panY: 0,
    totalFrames: 120,
    currentFrame: 0,
    isDragging: false,
    startX: 0,
    sensitivity: 6,
    canDrag: true,
    isAnimating: false,
    showAllStatuses: false,
    
    // Obrazy i ładowanie
    imagesBuildingCache: [],
    imagesMasksCache: [],
    loadedFramesCount: 0,
    isMakietaReady: false,
    imgBuilding: null,
    imgMask: null,
    imagesFarCache: [],
    isFarReady: false,
    loadedFarCount: 0,
    // Pozycja myszy i interakcja
    mouseX: 0,
    mouseY: 0,
    ticking: false,
    hoveredApartment: null,
    selectedApartment: null,

    // Baza mieszkań
    colorLinks: []
};

// Mask canvas (pamięć pomocnicza)
export const maskCanvas = document.createElement('canvas');
export const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });