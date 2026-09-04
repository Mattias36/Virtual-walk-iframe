const fs = require('fs');
const XLSX = require('xlsx');

// 1. Twoje przetworzone dane mieszkań
const apartmentsData = [
  { "id": "apt-1", "name": "Mieszkanie 1", "r": 195, "g": 111, "b": 223, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-2", "name": "Mieszkanie 2", "r": 206, "g": 112, "b": 224, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-3", "name": "Mieszkanie 3", "r": 160, "g": 112, "b": 224, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-4", "name": "Mieszkanie 4", "r": 112, "g": 111, "b": 223, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-5", "name": "Mieszkanie 5", "r": 216, "g": 111, "b": 223, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-6", "name": "Mieszkanie 6", "r": 195, "g": 223, "b": 112, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-7", "name": "Mieszkanie 7", "r": 111, "g": 160, "b": 224, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-8", "name": "Mieszkanie 8", "r": 223, "g": 111, "b": 215, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-9", "name": "Mieszkanie 9", "r": 160, "g": 223, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-10", "name": "Mieszkanie 10", "r": 111, "g": 181, "b": 223, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-11", "name": "Mieszkanie 11", "r": 181, "g": 223, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-12", "name": "Mieszkanie 12", "r": 223, "g": 112, "b": 206, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-13", "name": "Mieszkanie 13", "r": 223, "g": 111, "b": 224, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-14", "name": "Mieszkanie 14", "r": 111, "g": 195, "b": 223, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-15", "name": "Mieszkanie 15", "r": 112, "g": 223, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-16", "name": "Mieszkanie 16", "r": 111, "g": 223, "b": 160, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-17", "name": "Mieszkanie 17", "r": 111, "g": 223, "b": 181, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-18", "name": "Mieszkanie 18", "r": 111, "g": 223, "b": 206, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-19", "name": "Mieszkanie 19", "r": 255, "g": 255, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-20", "name": "Mieszkanie 20", "r": 236, "g": 112, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-21", "name": "Mieszkanie 21", "r": 247, "g": 112, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-22", "name": "Mieszkanie 22", "r": 206, "g": 112, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-23", "name": "Mieszkanie 23", "r": 112, "g": 223, "b": 196, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-24", "name": "Mieszkanie 24", "r": 255, "g": 111, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-25", "name": "Mieszkanie 25", "r": 223, "g": 112, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-26", "name": "Mieszkanie 26", "r": 255, "g": 112, "b": 247, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-27", "name": "Mieszkanie 27", "r": 246, "g": 255, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-28", "name": "Mieszkanie 28", "r": 112, "g": 223, "b": 215, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-29", "name": "Mieszkanie 29", "r": 206, "g": 255, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-30", "name": "Mieszkanie 30", "r": 223, "g": 255, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-31", "name": "Mieszkanie 31", "r": 112, "g": 215, "b": 224, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-32", "name": "Mieszkanie 32", "r": 181, "g": 255, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-33", "name": "Mieszkanie 33", "r": 112, "g": 223, "b": 223, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-34", "name": "Mieszkanie 34", "r": 223, "g": 160, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-35", "name": "Mieszkanie 35", "r": 236, "g": 255, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-36", "name": "Mieszkanie 36", "r": 111, "g": 206, "b": 223, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-37", "name": "Mieszkanie 37", "r": 111, "g": 255, "b": 112, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-38", "name": "Mieszkanie 38", "r": 111, "g": 255, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-39", "name": "Mieszkanie 39", "r": 223, "g": 111, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-40", "name": "Mieszkanie 40", "r": 255, "g": 111, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-41", "name": "Mieszkanie 41", "r": 255, "g": 112, "b": 181, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-42", "name": "Mieszkanie 42", "r": 255, "g": 112, "b": 223, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-43", "name": "Mieszkanie 43", "r": 111, "g": 255, "b": 246, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-44", "name": "Mieszkanie 44", "r": 255, "g": 112, "b": 206, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-45", "name": "Mieszkanie 45", "r": 112, "g": 255, "b": 206, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-46", "name": "Mieszkanie 46", "r": 112, "g": 255, "b": 235, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-47", "name": "Mieszkanie 47", "r": 111, "g": 255, "b": 223, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-48", "name": "Mieszkanie 48", "r": 111, "g": 111, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-49", "name": "Mieszkanie 49", "r": 255, "g": 181, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-50", "name": "Mieszkanie 50", "r": 255, "g": 206, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-51", "name": "Mieszkanie 51", "r": 255, "g": 223, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-52", "name": "Mieszkanie 52", "r": 255, "g": 246, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-53", "name": "Mieszkanie 53", "r": 112, "g": 236, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-54", "name": "Mieszkanie 54", "r": 223, "g": 195, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-55", "name": "Mieszkanie 55", "r": 224, "g": 181, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-56", "name": "Mieszkanie 56", "r": 255, "g": 236, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-57", "name": "Mieszkanie 57", "r": 181, "g": 111, "b": 223, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-58", "name": "Mieszkanie 58", "r": 207, "g": 223, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-59", "name": "Mieszkanie 59", "r": 215, "g": 223, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-60", "name": "Mieszkanie 60", "r": 223, "g": 224, "b": 111, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-61", "name": "Mieszkanie 61", "r": 112, "g": 182, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-62", "name": "Mieszkanie 62", "r": 224, "g": 215, "b": 112, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-63", "name": "Mieszkanie 63", "r": 111, "g": 206, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-64", "name": "Mieszkanie 64", "r": 111, "g": 223, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-65", "name": "Mieszkanie 65", "r": 111, "g": 247, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-66", "name": "Mieszkanie 66", "r": 181, "g": 112, "b": 255, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-67", "name": "Mieszkanie 67", "r": 255, "g": 112, "b": 235, "status": "Dostępne", "size": 50, "rooms": 2 },
  { "id": "apt-68", "name": "Mieszkanie 68", "r": 111, "g": 255, "b": 181, "status": "Dostępne", "size": 50, "rooms": 2 }
];

// 2. Mapowanie do układu kolumn wymaganego w Excelu
const excelRows = apartmentsData.map(apt => ({
  id: apt.id,
  name: apt.name,
  r: apt.r,
  g: apt.g,
  b: apt.b,
  url: `https://twojastrona.pl/${apt.id}`, // Przykładowy URL (edytuj wg potrzeb)
  size: apt.size,
  rooms: apt.rooms,
  price: '350 000', // Domyślna cena do uzupełnienia
  status: apt.status
}));

// 3. Generowanie arkusza Excel
const worksheet = XLSX.utils.json_to_sheet(excelRows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Mieszkania");

// 4. Zapis do pliku
XLSX.writeFile(workbook, "mieszkania.xlsx");
console.log("Plik mieszkania.xlsx został pomyślnie wygenerowany!");