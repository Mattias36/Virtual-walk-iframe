import os
from pathlib import Path
from PIL import Image
from tqdm import tqdm

# =========================================================================
# KONFIGURACJA
# =========================================================================
INPUT_DIR = "./static/MovieRenders/Uj_z_daleka"       # Folder ze zdjęciami 4K (JPEG)
OUTPUT_DIR = "./static/MovieRenders/zdjecia_fhd_z_daleka"     # Folder wyjściowy na zdjęcia Full HD
TARGET_WIDTH = 1920              # Docelowa szerokość (Full HD)
TARGET_HEIGHT = 1080             # Docelowa wysokość (Full HD)
QUALITY = 85                     # Jakość JPEG (80-85 to idealny balans)
# =========================================================================

def resize_images_to_fhd(input_folder, output_folder, target_w, target_h, quality):
    input_path = Path(input_folder)
    output_path = Path(output_folder)

    # Utworzenie folderu wyjściowego, jeśli nie istnieje
    output_path.mkdir(parents=True, exist_ok=True)

    # Pobranie listy plików JPEG / JPG
    valid_extensions = ('.jpg', '.jpeg', '.JPG', '.JPEG')
    image_files = sorted([f for f in input_path.iterdir() if f.suffix in valid_extensions])

    if not image_files:
        print(f"Błąd: Nie znaleziono plików JPEG w folderze: {input_folder}")
        return

    print(f"Znaleziono {len(image_files)} zdjęć. Rozpoczynanie skalowania do Full HD ({target_w}x{target_h})...\n")

    converted_count = 0
    total_orig_size = 0
    total_new_size = 0

    for file_path in tqdm(image_files, desc="Postęp skalowania"):
        try:
            output_file_path = output_path / file_path.name

            with Image.open(file_path) as img:
                # Wyznaczenie nowych wymiarów z zachowaniem proporcji (Letterbox / Contain)
                img.thumbnail((target_w, target_h), Image.Resampling.LANCZOS)
                
                # Upewniamy się, że obraz jest w trybie RGB przed zapisem do JPG
                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Zapis z optymalizacją pod sieć WWW
                img.save(
                    output_file_path, 
                    "JPEG", 
                    quality=quality, 
                    optimize=True
                )

            orig_size = file_path.stat().st_size
            new_size = output_file_path.stat().st_size
            
            total_orig_size += orig_size
            total_new_size += new_size
            converted_count += 1

        except Exception as e:
            print(f"\nBłąd podczas przetwarzania pliku {file_path.name}: {e}")

    # Podsumowanie oszczędności miejsca
    if converted_count > 0:
        orig_mb = total_orig_size / (1024 * 1024)
        new_mb = total_new_size / (1024 * 1024)
        saved_pct = (1 - (total_new_size / total_orig_size)) * 100

        print("\n" + "="*50)
        print("SKALOWANIE ZAKOŃCZONE SUKCESEM!")
        print(f"Przetworzono plików: {converted_count}/{len(image_files)}")
        print(f"Rozmiar 4K:       {orig_mb:.2f} MB")
        print(f"Rozmiar Full HD:  {new_mb:.2f} MB")
        print(f"Oszczędność:      {saved_pct:.1f}% mniejsza waga zdjęć!")
        print("="*50)

if __name__ == "__main__":
    resize_images_to_fhd(INPUT_DIR, OUTPUT_DIR, TARGET_WIDTH, TARGET_HEIGHT, QUALITY)