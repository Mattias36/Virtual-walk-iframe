/**
 * Wirtualny Spacer - Stabilna wersja SPA z preloadingiem Blob URL i Auto-Rotate
 */

window.viewer = null;
window.userHasNavigated = false;

// NOWOŚĆ: Zmienne globalne na Bloby, aby fetch wykonał się TYLKO RAZ przy pierwszym uruchomieniu
window.cachedBlobPano1 = null;
window.cachedBlobPano2 = null;
window.cachedBlobPano3 = null;
window.cachedBlobPano4 = null;
window.cachedBlobPano5 = null;
window.cachedBlobPano6 = null;
window.cachedBlobPano7 = null;





async function initPanorama() {
    console.log("Inicjalizacja nowej instancji panoramy...");

    const viewerElement = document.getElementById('panorama-viewer');
    if (!viewerElement) return;

    if (typeof panorama1Path === 'undefined' || typeof panorama2Path === 'undefined' || typeof panorama3Path === 'undefined'
     || typeof panorama4Path === 'undefined' || typeof panorama5Path === 'undefined' || typeof panorama6Path === 'undefined'
     || typeof panorama7Path === 'undefined') {
        return;
    }

    const walkToolbar = document.getElementById('walk-view-toolbar') || (() => {
        const toolbar = document.createElement('div');
        toolbar.id = 'walk-view-toolbar';
        toolbar.className = 'walk-view-toolbar';
        document.getElementById('container-walk')?.appendChild(toolbar);
        return toolbar;
    })();

    let backBtn = document.getElementById('btn-back-to-makieta');
    if (!backBtn) {
        backBtn = document.createElement('button');
        backBtn.id = 'btn-back-to-makieta';
        backBtn.title = 'Powrót do widoku 3D';
        backBtn.onclick = () => switchMode('makieta');
        backBtn.innerHTML = `
            <svg class="icon-back" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                style="width: 20px; height: 20px; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Powrót do widoku 3D
        `;
        walkToolbar.appendChild(backBtn);
    } else if (backBtn.parentNode !== walkToolbar) {
        walkToolbar.appendChild(backBtn);
    }

    const fullscreenWalkBtn = document.getElementById('btn-fullscreen-walk');
    if (fullscreenWalkBtn && fullscreenWalkBtn.parentNode !== walkToolbar) {
        walkToolbar.appendChild(fullscreenWalkBtn);
    }

    // Funkcja pobierająca obraz w tle i zamieniająca go na Blob URL
    async function getBlobURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP status ${response.status}`);
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (e) {
            console.warn("Błąd preloada zdjęcia (CORS/fallback): ", e);
            return url;
        }
    }

    // Pobieramy zdjęcia przez fetch tylko za PIERWSZYM razem
    if (!window.cachedBlobPano1 || !window.cachedBlobPano2 || !window.cachedBlobPano3 || !window.cachedBlobPano4 
        || !window.cachedBlobPano5 || !window.cachedBlobPano6 || !window.cachedBlobPano7)  
        {
        console.log("Pobieranie zdjęć do pamięci podręcznej (pierwsze uruchomienie)...");
        const [blob1, blob2, blob3, blob4, blob5, blob6, blob7] = await Promise.all([
            getBlobURL(panorama1Path),
            getBlobURL(panorama2Path),
            getBlobURL(panorama3Path),
            getBlobURL(panorama4Path),
            getBlobURL(panorama5Path),
            getBlobURL(panorama6Path),
            getBlobURL(panorama7Path),

        ]);
        window.cachedBlobPano1 = blob1;
        window.cachedBlobPano2 = blob2;
        window.cachedBlobPano3 = blob3;
        window.cachedBlobPano4 = blob4;
        window.cachedBlobPano5 = blob5;
        window.cachedBlobPano6 = blob6;
        window.cachedBlobPano7 = blob7;
    }

    try {
        // Inicjalizacja Pannellum
        window.viewer = pannellum.viewer('panorama-viewer', {
            "default": {
                "firstScene": "scenaPierwsza",
                "autoLoad": true,
                "sceneFadeDuration": 800,
                "compass": true,
                "northOffset": 0
            },
            "scenes": {
                "scenaPierwsza": {
                    "title": "Scena 1",
                    "type": "equirectangular",
                    "panorama": window.cachedBlobPano1,
                    "autoRotate": -1,
                    "hotSpots": [
                        {
                            "pitch": -185,
                            "yaw": 0,
                            "type": "scene",
                            "sceneId": "scenaDruga",
                            "targetYaw": 0,
                            "targetPitch": 0
                        },
                        {
                            "pitch": 5,
                            "yaw": -35,
                            "type": "scene",
                            "sceneId": "scenaTrzecia",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },
                        {
                            "pitch": 38,
                            "yaw": 77,
                            "type": "scene",
                            "sceneId": "scenaCzwarta",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },
                        {
                            "pitch": -3,
                            "yaw": -40,
                            "type": "scene",
                            "sceneId": "scenaPiata",
                            "targetYaw": -180,
                            "targetPitch": 0,

                        },
                        {
                            "pitch": 33,
                            "yaw": 110,
                            "type": "scene",
                            "sceneId": "scenaSzosta",
                            "targetYaw": 0,
                            "targetPitch": 0,
                        },
                        {
                            "pitch": 28,
                            "yaw": 13,
                            "type": "scene",
                            "sceneId": "scenaSiodma",
                            "targetYaw": 0,
                            "targetPitch": 0,
                        }
                    ]
                },
                "scenaDruga": {
                    "title": "Scena 2",
                    "type": "equirectangular",
                    "panorama": window.cachedBlobPano2,
                    "hotSpots": [
                        {
                            "pitch": 2,
                            "yaw": -45,
                            "type": "scene",
                            "sceneId": "scenaPierwsza",
                            "targetYaw": 0,
                            "targetPitch": 0,
                            // "targetHfov": 120
                        },

                    ]
                },
                "scenaTrzecia": {
                    "title": "Scena 3",
                    "type": "equirectangular",
                    "panorama": window.cachedBlobPano3,
                    "hotSpots": [
                        {
                            "pitch": 2,
                            "yaw": 50,
                            "type": "scene",
                            "sceneId": "scenaPierwsza",
                            "targetYaw": -210,
                            "targetPitch": 0,

                        },
                        {
                            "pitch": 0,
                            "yaw": 60,
                            "type": "scene",

                            "sceneId": "scenaPiata",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },

                    ]
                },
                "scenaCzwarta": {
                    "title": "Scena 4",
                    "type": "equirectangular",
                    "panorama": window.cachedBlobPano4,
                    "hotSpots": [
                        {
                            "pitch": -30,
                            "yaw": 10,
                            "type": "scene",
                            "sceneId": "scenaPierwsza",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },
                        {
                            "pitch": -4,
                            "yaw": -60,
                            "type": "scene",
                            "sceneId": "scenaSzosta",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },
                        {
                            "pitch": -30,
                            "yaw": 30,
                            "type": "scene",
                            "sceneId": "scenaPiata",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        }
                    ]
                },
                "scenaPiata": {
                    "title": "Scena 5",
                    "type": "equirectangular",
                    "panorama": window.cachedBlobPano5,
                    "hotSpots": [
                        {
                            "pitch": -3,
                            "yaw": 35,
                            "type": "scene",
                            "sceneId": "scenaPierwsza",
                            "targetYaw": -210,
                            "targetPitch": 0,

                        },
                        {
                            "pitch": 5,
                            "yaw": -130,
                            "type": "scene",
                            "sceneId": "scenaTrzecia",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },
                        {
                            "pitch": 28,
                            "yaw": -5,
                            "type": "scene",
                            "sceneId": "scenaCzwarta",
                            "targetYaw": 0,
                            "targetPitch": 0,
                        },
                        {
                            "pitch": 23,
                            "yaw": 15,
                            "type": "scene",
                            "sceneId": "scenaSzosta",
                            "targetYaw": 0,
                            "targetPitch": 0,
                        },
                        {
                            "pitch": 31,
                            "yaw": -63,
                            "type": "scene",
                            "sceneId": "scenaSiodma",
                            "targetYaw": 0,
                            "targetPitch": 0,
                        },
                      
                    ]
                },
                "scenaSzosta": {
                    "title": "Scena 6",
                    "type": "equirectangular",
                    "panorama": window.cachedBlobPano6,
                    "hotSpots": [
                        {
                            "pitch": -13,
                            "yaw": 63,
                            "type": "scene",
                            "sceneId": "scenaPierwsza",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },
                        {
                            "pitch": 1,
                            "yaw": 86,
                            "type": "scene",
                            "sceneId": "scenaSiodma",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },
                        {
                            "pitch": -1,
                            "yaw": 95,
                            "type": "scene",
                            "sceneId": "scenaCzwarta",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        }
                    ]
                },
                "scenaSiodma": {
                    "title": "Scena 7",
                    "type": "equirectangular",
                    "panorama": window.cachedBlobPano7,
                    "hotSpots": [
                        {
                            "pitch": -22,
                            "yaw": -57,
                            "type": "scene",
                            "sceneId": "scenaPierwsza",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },  
                        {
                            "pitch": -3,
                            "yaw": -97,
                            "type": "scene",

                            "sceneId": "scenaCzwarta",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },  
                        {
                            "pitch": -1,
                            "yaw": -88,
                            "type": "scene",
                            "sceneId": "scenaSzosta",
                            "targetYaw": 0,
                            "targetPitch": 0,

                        },  
                    ]
                }

            }
        });

        // PO ZAINICJOWANIU PANNELLUM: Upewniamy się, że przyciski pozostają w toolbarze, a nie są wstrzykiwane do DOM Pannellum
        const walkToolbar = document.getElementById('walk-view-toolbar');
        if (walkToolbar) {
            const walkBackBtn = document.getElementById('btn-back-to-makieta');
            const walkFullscreenBtn = document.getElementById('btn-fullscreen-walk');

            if (walkBackBtn && walkBackBtn.parentNode !== walkToolbar) {
                walkToolbar.appendChild(walkBackBtn);
            }

            if (walkFullscreenBtn && walkFullscreenBtn.parentNode !== walkToolbar) {
                walkToolbar.appendChild(walkFullscreenBtn);
            }
        }

        window.viewer.on('scenechange', function (targetSceneId) {
            if (targetSceneId === 'scenaDruga' || targetSceneId === 'scenaTrzecia' || targetSceneId === 'scenaCzwarta' || targetSceneId === 'scenaPiata' || targetSceneId === 'scenaSzosta') {
                window.userHasNavigated = true;
            }
            if (targetSceneId === 'scenaPierwsza' && window.userHasNavigated) {
                window.viewer.stopAutoRotate();
            }
        });

        viewerElement.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            e.stopPropagation();
        }, true);

    } catch (err) {
        console.error("Błąd tworzenia widzu: ", err);
    }
}