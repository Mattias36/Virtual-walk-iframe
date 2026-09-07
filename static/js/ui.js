import { state } from './state.js';
import { drawScene, getApartmentCenterCoords } from './renderer.js';
import { rotateToDirection } from './controls.js';

const tooltip = document.getElementById('apartment-tooltip');
let pendingSelectionTimeout = null;
let sidebarScrollAnchor = null;

function restoreSelectedApartmentTooltip() {
    if (!state.showAllStatuses && state.selectedApartment) {
        showApartmentTooltipAtCenter(state.selectedApartment);
    }
}

window.addEventListener('apartment-rotation-end', restoreSelectedApartmentTooltip);

function updateApartmentTooltipPosition(data) {
    if (!data || !tooltip) return;

    const coords = getApartmentCenterCoords(data);
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const wrapperRect = canvasWrapper?.getBoundingClientRect();

    if (!coords || !wrapperRect) return;

    tooltip.style.left = `${wrapperRect.left + coords.x}px`;
    tooltip.style.top = `${wrapperRect.top + coords.y}px`;
}

const canvasWrapper = document.getElementById('canvas-wrapper');
if (canvasWrapper && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
        if (!tooltip?.classList.contains('hidden') && state.selectedApartment) {
            updateApartmentTooltipPosition(state.selectedApartment);
        }
    }).observe(canvasWrapper);
}

export function renderApartmentList() {
    const container = document.getElementById('apartment-list-container');
    if (!container) return;

    container.innerHTML = '';
    
    state.colorLinks.forEach(apt => {
        const item = document.createElement('div');
        item.className = 'apartment-item';
        item.setAttribute('data-id', apt.id);
        
        const statusClass = apt.status.toLowerCase().replace('ę', 'e'); 

        item.innerHTML = `
            <div class="apt-title">${apt.name}</div>
            <div class="apt-desc">
                ${apt.size} m² • <span class="badge ${statusClass}">${apt.status}</span>
            </div>
        `;

        item.addEventListener('click', () => {
            const isSelected = state.selectedApartment?.id === apt.id;
            selectApartment(isSelected ? null : apt.id, !isSelected);
        });

        container.appendChild(item);
    });
}

function scrollToApartment(apartmentId, behavior = 'smooth') {
    const listContainer = document.getElementById('apartment-list-container');
    const activeItem = document.querySelector(`.apartment-item[data-id="${apartmentId}"]`);
    if (!activeItem || !listContainer) return;

    activeItem.classList.add('active');

    const targetScrollTop = activeItem.offsetTop -
        (listContainer.clientHeight / 2) +
        (activeItem.offsetHeight / 2);

    listContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior
    });
}

export function selectApartment(apartmentId, shouldRotate = false) {
    const card = document.getElementById('apartment-info-card');

    if (pendingSelectionTimeout) {
        clearTimeout(pendingSelectionTimeout);
        pendingSelectionTimeout = null;
    }
    
    // 1. Czyszczenie poprzednich zaznaczeń z listy
    document.querySelectorAll('.apartment-item').forEach(el => el.classList.remove('active'));

    // Ukrycie tooltipa na czas akcji
    // const tooltip = document.getElementById('apartment-tooltip');
    if (tooltip) tooltip.classList.add('hidden');

    if (!apartmentId) {
        state.selectedApartment = null;
        state.hoveredApartment = null;
        if (card) card.classList.add('hidden');
        if (typeof drawScene === 'function') drawScene();
        return;
    }

    const data = state.colorLinks.find(item => item.id === apartmentId);
    if (!data) return;

    // 2. Sztywne przypisanie wybranego i podświetlonego mieszkania
    state.selectedApartment = data;
    state.hoveredApartment = data;

    // OD RAZU PRZERYSOWUJEMY SCENĘ – żeby podświetlenie błyskawicznie pojawiło się na makiecie
    if (typeof drawScene === 'function') drawScene();

    // --- AUTOROTACJA MAKIETY ---
    if (shouldRotate) {
        const targetFrame = data.frame !== undefined ? data.frame : data.targetFrame;
        
        if (targetFrame !== undefined && typeof rotateToDirection === 'function') {
            let diff = Number(targetFrame) - state.currentFrame;
            if (diff > state.totalFrames / 2) diff -= state.totalFrames;
            if (diff < -state.totalFrames / 2) diff += state.totalFrames;
            
            const steps = Math.abs(diff);
            const animDuration = (steps * 20) + 250;

            rotateToDirection(Number(targetFrame));

            pendingSelectionTimeout = setTimeout(() => {
                pendingSelectionTimeout = null;
                state.hoveredApartment = data;
                showApartmentTooltipAtCenter(data);
            }, animDuration);
        }
    } else {
        showApartmentTooltipAtCenter(data);
    }

    // Aktualizacja karty informacyjnej
    const sizeEl = document.getElementById('info-size');
    const roomsEl = document.getElementById('info-rooms');
    const priceEl = document.getElementById('info-price');
    const statusEl = document.getElementById('info-status');

    if (sizeEl) sizeEl.textContent = data.size;
    if (roomsEl) roomsEl.textContent = data.rooms;
    if (priceEl) priceEl.textContent = data.price;
    if (statusEl) {
        statusEl.textContent = data.status;
        if (data.status === 'Wolne' || data.status === 'Dostępne') statusEl.style.color = '#00ff00';
        else if (data.status === 'Rezerwacja') statusEl.style.color = '#ffcc00';
        else if (data.status === 'Sprzedane') statusEl.style.color = '#ff3333';
        else statusEl.style.color = '#ffffff';
    }

    if (card) card.classList.remove('hidden');

    // 3. Obsługa Sidebara i Scrollowania
    const sidebarContainer = document.getElementById('sidebar-container');
    const listContainer = document.getElementById('apartment-list-container');
    const isSidebarOpen = sidebarContainer && sidebarContainer.classList.contains('open');

    if (!isSidebarOpen) {
        if (typeof clear4kState === 'function') clear4kState();
        if (listContainer) listContainer.scrollTop = 0;
        sidebarScrollAnchor = null;
        
        // Wywołujemy rozwinięcie sidebara
        if (typeof toggleSidebar === 'function') toggleSidebar();

        setTimeout(() => {
            if (state.selectedApartment?.id !== apartmentId) return;
            scrollToApartment(apartmentId);
            // Ponowne upewnienie się, że podświetlenie przetrwało otwieranie panelu
            state.hoveredApartment = data;
            if (typeof drawScene === 'function') drawScene();
        }, 380);
    } else {
        scrollToApartment(apartmentId);
    }
}
// POMOCNICZA FUNKCJA: Wywoływana PO ZAKOŃCZENIU rotacji
function showApartmentTooltipAtCenter(data) {
    if (!data || state.showAllStatuses) {
        if (tooltip) tooltip.classList.add('hidden');
        return;
    }

    // Ponownie upewniamy się, że podświetlenie jest aktywne
    state.hoveredApartment = data;
    if (typeof drawScene === 'function') drawScene();
    
    const tooltip = document.getElementById('apartment-tooltip');
    if (!tooltip) return;

    const coords = getApartmentCenterCoords(data);

    if (coords) {
        let statusColor = '#00ff00';
        if (data.status === 'Rezerwacja') statusColor = '#ffcc00';
        else if (data.status === 'Sprzedane') statusColor = '#ff3333';

        tooltip.innerHTML = `
            <div class="tooltip-title">${data.name}</div>
            <div class="tooltip-row"><span>Metraż:</span><span><strong>${data.size} m²</strong></span></div>
            <div class="tooltip-row"><span>Pokoje:</span><span><strong>${data.rooms}</strong></span></div>
            <div class="tooltip-row"><span>Status:</span><span style="color: ${statusColor}; font-weight: bold;">${data.status}</span></div>
        `;

        updateApartmentTooltipPosition(data);
        tooltip.classList.remove('hidden');
    }
}

export function toggleSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    const toggleIcon = document.getElementById('toggle-icon');
    const listContainer = document.getElementById('apartment-list-container');
    if (!sidebarContainer) return;

    const wasOpen = sidebarContainer.classList.contains('open');
    if (wasOpen && listContainer) {
        const activeItem = listContainer.querySelector('.apartment-item.active');
        const listRect = listContainer.getBoundingClientRect();

        sidebarScrollAnchor = activeItem ? {
            id: activeItem.dataset.id,
            top: activeItem.getBoundingClientRect().top - listRect.top
        } : null;
    }

    sidebarContainer.classList.toggle('open');
    const isOpen = sidebarContainer.classList.contains('open');

    // Resetujemy współrzędne myszy (żeby kursor nie "duchował"),
    // ale ZACHOWUJEMY podświetlenie, jeśli jakieś mieszkanie jest wybrane!
    state.mouseX = -1;
    state.mouseY = -1;

    if (state.selectedApartment) {
        state.hoveredApartment = state.selectedApartment;
    }

    if (toggleIcon) {
        toggleIcon.innerHTML = isOpen ? "&#10095;" : "&#10094;";
    }

    if (isOpen && typeof clear4kState === 'function') {
        clear4kState();
    }

    // Po zakończeniu animacji sidebara przerysowujemy scenę z wybranym mieszkaniem
    setTimeout(() => {
        if (isOpen && listContainer && sidebarScrollAnchor) {
            const activeItem = listContainer.querySelector(
                `.apartment-item[data-id="${sidebarScrollAnchor.id}"]`
            );
            const listRect = listContainer.getBoundingClientRect();

            if (activeItem) {
                const currentTop = activeItem.getBoundingClientRect().top - listRect.top;
                listContainer.scrollTop += currentTop - sidebarScrollAnchor.top;
            }

            sidebarScrollAnchor = null;
        }

        if (state.selectedApartment) {
            state.hoveredApartment = state.selectedApartment;
        }
        if (typeof drawScene === 'function') drawScene();

        if (state.selectedApartment) {
            showApartmentTooltipAtCenter(state.selectedApartment);
        }
    }, 360);
}

function clear4kState() {
    if (state.loaded4KImage) {
        state.loaded4KImage.src = ''; // Anuluje pobieranie/trzymanie w pamięci RAM
        state.loaded4KImage = null;
    }
    // Jeśli używasz elementu <img> w HTML do podglądu 4K:
    const img4KEl = document.getElementById('image-4k-preview'); 
    if (img4KEl) {
        img4KEl.src = '';
        img4KEl.classList.add('hidden');
    }
}

export function toggleLegend() {
    const btnToggleLegend = document.getElementById('btn-toggle-legend');
    const legendBox = document.getElementById('legend-box');

    state.showAllStatuses = !state.showAllStatuses;

    if (btnToggleLegend) {
        btnToggleLegend.classList.toggle('active', state.showAllStatuses);
    }

    if (legendBox) {
        legendBox.classList.toggle('hidden', !state.showAllStatuses);
    }

    drawScene();

    if (!state.showAllStatuses && state.selectedApartment) {
        showApartmentTooltipAtCenter(state.selectedApartment);
    }
}