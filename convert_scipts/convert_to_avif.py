import os
from pathlib import Path
from PIL import Image
import pillow_avif  # Rejestruje obsługę formatu AVIF w Pillow
from tqdm import tqdm

# =========================================================================
# KONFIGURACJA
# =========================================================================
INPUT_DIR = "./Uj_z_daleka"      # Ścieżka do folderu z plikami JPEG
OUTPUT_DIR = "./Uj_z_daleka_avif"    # Ścieżka do folderu wyjściowego dla AVIF
QUALITY = 80                     # Jakość AVIF (zalecane: 75 - 85)
MAX_WORKERS = 4                  # Wartość jakości dająca super kompresję
# =========================================================================

def convert_jpeg_to_avif(input_folder, output_folder, quality=80):
    input_path = Path(input_folder)
    output_path = Path(output_folder)

    # Tworzenie folderu wyjściowego, jeśli nie istnieje
    output_path.mkdir(parents=True, exist_ok=True)

    # Pobranie listy plików JPEG / JPG
    valid_extensions = ('.jpg', '.jpeg', '.JPG', '.JPEG')
    image_files = [f for f in input_path.iterdir() if f.suffix in valid_extensions]

    if not image_files:
        print(f"Nie znaleziono plików JPEG w folderze: {input_folder}")
        return

    print(f"Znaleziono {len(image_files)} zdjęć. Rozpoczynanie konwersji do AVIF (Jakość: {quality})...\n")

    converted_count = 0
    total_original_size = 0
    total_new_size = 0

    for file_path in tqdm(image_files, desc="Postęp konwersji"):
        try:
            # Określenie nowej ścieżki pliku .avif
            output_file_path = output_path / f"{file_path.stem}.avif"

            # Otwarcie obrazu i zapis do AVIF
            with Image.open(file_path) as img:
                # Konwersja Palety/RGBA na RGB jeśli to konieczne
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                
                img.save(output_file_path, "AVIF", quality=quality, speed=6)

            # Statystyki oszczędności miejsca
            orig_size = file_path.stat().st_size
            new_size = output_file_path.stat().st_size
            
            total_original_size += orig_size
            total_new_size += new_size
            converted_count += 1

        except Exception as e:
            print(f"\nBłąd podczas konwersji pliku {file_path.name}: {e}")

    # Podsumowanie
    if converted_count > 0:
        orig_mb = total_original_size / (1024 * 1024)
        new_mb = total_new_size / (1024 * 1024)
        saved_pct = (1 - (total_new_size / total_original_size)) * 100

        print("\n" + "="*50)
        print("KONWERSJA ZAKOŃCZONA SUKCESEM!")
        print(f"Przekonwertowano plików: {converted_count}/{len(image_files)}")
        print(f"Rozmiar przed: {orig_mb:.2f} MB")
        print(f"Rozmiar po:    {new_mb:.2f} MB")
        print(f"Zaoszczędzono:  {saved_pct:.1f}% miejsca na dysku / transferu!")
        print("="*50)

if __name__ == "__main__":
    convert_jpeg_to_avif(INPUT_DIR, OUTPUT_DIR, quality=QUALITY)