import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';

const MASKS_DIR = './static/MovieRenders/Maski/'; 
const TOTAL_FRAMES = 120;
const TOLERANCE = 2;

// MINIMALNA LICZBA PIKSELI: Piksele krawędziowe pojawiają się rzadko.
// Prawdziwe mieszkanie ma tysiące pikseli na klatkach.
const MIN_PIXEL_COUNT = 100; 

// Słownik do zliczania wystąpień kolorów
const colorCounts = [];

function findMatchingColorIndex(r, g, b) {
    return colorCounts.findIndex(item => 
        Math.abs(item.r - r) <= TOLERANCE &&
        Math.abs(item.g - g) <= TOLERANCE &&
        Math.abs(item.b - b) <= TOLERANCE
    );
}

async function extractColors() {
    console.log("🚀 Rozpocinanie analizy z filtracją krawędzi i zliczaniem pikseli...");

    for (let i = 0; i < TOTAL_FRAMES; i++) {
        const paddedIndex = String(i).padStart(4, '0');
        const filePath = path.join(MASKS_DIR, `Maski_rendery.${paddedIndex}.png`); 

        if (!fs.existsSync(filePath)) continue;

        try {
            const img = await loadImage(filePath);
            const canvas = createCanvas(img.width, img.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const data = ctx.getImageData(0, 0, img.width, img.height).data;

            for (let j = 0; j < data.length; j += 4) {
                const r = data[j];
                const g = data[j + 1];
                const b = data[j + 2];
                const a = data[j + 3];

                // Warunek tła z Twojej aplikacji
                const isDark = (r < 113 && g < 113 && b < 113);
                const isTransparent = (a !== undefined && a < 10);

                if (isDark || isTransparent) continue;

                // Szukamy czy ten kolor (lub zbliżony w ±2) już istnieje
                const existingIndex = findMatchingColorIndex(r, g, b);

                if (existingIndex !== -1) {
                    colorCounts[existingIndex].count++;
                } else {
                    colorCounts.push({ r, g, b, count: 1, firstFrame: i });
                }
            }
        } catch (err) {
            console.error(`Błąd w ${filePath}:`, err);
        }
    }

    // ODFILTROWANIE KRAWĘDZI: Zostawiamy tylko kolory, które mają dużo pikseli
    const validApartments = colorCounts.filter(c => c.count >= MIN_PIXEL_COUNT);

    console.log("\n==========================================");
    console.log(`🎉 Odnaleziono ${validApartments.length} prawdziwych mieszkań (odrzucono ${colorCounts.length - validApartments.length} kolorów krawędziowych).`);
    console.log("==========================================\n");

    const outputData = validApartments.map((c, index) => ({
        id: `apt-${index + 1}`,
        name: `Mieszkanie ${index + 1}`,
        r: c.r,
        g: c.g,
        b: c.b,
        status: "Dostępne",
        size: 50.0,
        rooms: 2,
        _debugCount: c.count // liczba wykrytych pikseli
    }));

    fs.writeFileSync('extracted_apartments.json', JSON.stringify(outputData, null, 2));
    console.log("💾 Wynik zapisano w: extracted_apartments.json");
}

extractColors();