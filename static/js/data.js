import { state } from './state.js';
import { renderApartmentList } from './ui.js';

// Domyślna baza (gdy brak Excela)
export const defaultColorLinks = [
    { id: 'blok-bialy', name: 'Mieszkanie 101', r: 203, g: 87, b: 99, url: 'https://twojastrona.pl/blok-bialy', size: 54.5, rooms: 3, price: '450 000', status: 'Dostępne' },
    { id: 'blok-czerwony', name: 'Mieszkanie 102', r: 180, g: 186, b: 149, url: 'https://twojastrona.pl/blok-czerwony', size: 78.2, rooms: 4, price: '620 000', status: 'Rezerwacja' },
    { id: 'blok-niebieski', name: 'Mieszkanie 103', r: 125, g: 121, b: 196, url: 'https://twojastrona.pl/blok-niebieski', size: 61.0, rooms: 3, price: '320 000', status: 'Sprzedane' },
    { id: 'blok-zielony', name: 'Mieszkanie 104', r: 119, g: 189, b: 164, url: 'https://twojastrona.pl/blok-zielony', size: 38.0, rooms: 2, price: '220 000', status: 'Rezerwacja' },
    { id: 'blok-szary-1', name: 'Mieszkanie 105/1', r: 202, g: 78, b: 156, url: 'https://twojastrona.pl/blok-szary-1', size: 33.0, rooms: 2, price: '200 000', status: 'Dostępne' },
    { id: 'blok-szary-2', name: 'Mieszkanie 105/2', r: 137, g: 181, b: 190, url: 'https://twojastrona.pl/blok-szary-2', size: 33.0, rooms: 2, price: '200 000', status: 'Sprzedane' },
    { id: 'blok-granatowy-1', name: 'Mieszkanie 106/1', r: 200, g: 128, b: 42, url: 'https://twojastrona.pl/blok-granatowy-1', size: 43.0, rooms: 3, price: '340 000', status: 'Rezerwacja' },
    { id: 'blok-granatowy-2', name: 'Mieszkanie 106/2', r: 194, g: 168, b: 76, url: 'https://twojastrona.pl/blok-granatowy-2', size: 40.0, rooms: 3, price: '337 000', status: 'Dostępne' },
    { id: 'blok-rozowy-1', name: 'Mieszkanie 107/1', r: 213, g: 60, b: 49, url: 'https://twojastrona.pl/blok-rozowy-1', size: 55.0, rooms: 4, price: '580 000', status: 'Sprzedane' },
    { id: 'blok-rozowy-2', name: 'Mieszkanie 107/2', r: 45, g: 143, b: 68, url: 'https://twojastrona.pl/blok-rozowy-2', size: 45.0, rooms: 3, price: '450 500', status: 'Dostępne' },
    { id: 'blok-fioletowy-1', name: 'Mieszkanie 108/1', r: 95, g: 136, b: 196, url: 'https://twojastrona.pl/blok-fioletowy-1', size: 65.0, rooms: 3, price: '630 100', status: 'Rezerwacja' },
    { id: 'blok-fioletowy-2', name: 'Mieszkanie 108/2', r: 96, g: 189, b: 62, url: 'https://twojastrona.pl/blok-fioletowy-2', size: 35.0, rooms: 2, price: '330 100', status: 'Rezerwacja' }
];

// export async function loadApartmentsFromExcel() {
//     state.colorLinks = [...defaultColorLinks];
//     try {
//         const response = await fetch('./mieszkania.xlsx?v=' + new Date().getTime());
//         if (!response.ok) throw new Error("Brak pliku mieszkania.xlsx, używam danych domyślnych.");

//         const arrayBuffer = await response.arrayBuffer();
//         const workbook = XLSX.read(arrayBuffer, { type: 'array' });
//         const firstSheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[firstSheetName];
//         const rawData = XLSX.utils.sheet_to_json(worksheet);

//         if (rawData && rawData.length > 0) {
//             state.colorLinks = rawData.map(row => ({
//                 id: String(row.id).trim(),
//                 name: String(row.name).trim(),
//                 r: parseInt(row.r),
//                 g: parseInt(row.g),
//                 b: parseInt(row.b),
//                 url: String(row.url).trim(),
//                 size: parseFloat(row.size),
//                 rooms: parseInt(row.rooms),
//                 price: String(row.price).trim(),
//                 status: String(row.status).trim(),
//                 frame: row.frame !== undefined ? parseInt(row.frame) : undefined
//             }));
//             console.log("Pomyślnie wczytano bazę z pliku mieszkania.xlsx!");
//         }
//     } catch (err) {
//         console.warn(err.message);
//     } finally {
//         renderApartmentList();
//     }
// }

export async function loadApartmentsFromExcel() {
    //Resetuj do danych domyślnych na start
    state.colorLinks = typeof defaultColorLinks !== 'undefined' ? [...defaultColorLinks] : [];

    // 1. TRYB NW.JS / ELEKTRON (PLIK .EXE)
    try {
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            const path = require('path');

            // Lokalizacja pliku .exe
            const exeDir = path.dirname(process.execPath);
            const exeExcelPath = path.join(exeDir, 'mieszkania.xlsx');

            // Fallback dla NW.js (katalog projektu/rozpakowany)
            const devExcelPath = path.join(process.cwd(), 'mieszkania.xlsx');

            const finalPath = fs.existsSync(exeExcelPath) ? exeExcelPath : (fs.existsSync(devExcelPath) ? devExcelPath : null);

            if (finalPath) {
                console.log("[NW.js] Wczytuję plik Excel z:", finalPath);
                const fileBuffer = fs.readFileSync(finalPath);
                
                const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawData = XLSX.utils.sheet_to_json(worksheet);

                if (rawData && rawData.length > 0) {
                    state.colorLinks = rawData.map(row => ({
                        id: String(row.id).trim(),
                        name: String(row.name).trim(),
                        r: parseInt(row.r),
                        g: parseInt(row.g),
                        b: parseInt(row.b),
                        url: String(row.url).trim(),
                        size: parseFloat(row.size),
                        rooms: parseInt(row.rooms),
                        price: String(row.price).trim(),
                        status: String(row.status).trim(),
                        frame: row.frame !== undefined ? parseInt(row.frame) : undefined
                    }));
                    console.log("[NW.js] Pomyślnie załadowano dane z pliku Excel!");
                }
                renderApartmentList();
                return;
            }
        }
    } catch (err) {
        console.warn("[NW.js] Nie udało się odczytać pliku przez FS:", err);
    }

    // 2. TRYB PRZEGLĄDARKI / LIVE SERVER (FALLBACK HTTP)
    try {
        const response = await fetch('./mieszkania.xlsx?v=' + Date.now());
        if (!response.ok) throw new Error("Brak pliku mieszkania.xlsx na serwerze.");

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        if (rawData && rawData.length > 0) {
            state.colorLinks = rawData.map(row => ({
                id: String(row.id).trim(),
                name: String(row.name).trim(),
                r: parseInt(row.r),
                g: parseInt(row.g),
                b: parseInt(row.b),
                url: String(row.url).trim(),
                size: parseFloat(row.size),
                rooms: parseInt(row.rooms),
                price: String(row.price).trim(),
                status: String(row.status).trim(),
                frame: row.frame !== undefined ? parseInt(row.frame) : undefined
            }));
            console.log("[Fetch] Pomyślnie załadowano dane z pliku Excel!");
        }
    } catch (err) {
        console.warn("[Fetch]", err.message);
    } finally {
        renderApartmentList();
    }
} 