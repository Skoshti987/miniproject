import os
import shutil
import hashlib
import json
from PIL import Image
import numpy as np

RAW_DIR = r'd:\Sem 3\Miniproject\ml\dataset\raw'
PROCESSED_DIR = r'd:\Sem 3\Miniproject\ml\dataset\processed'
SPLIT_DIRS = {
    'train': r'd:\Sem 3\Miniproject\ml\dataset\train',
    'val': r'd:\Sem 3\Miniproject\ml\dataset\validation',
    'test': r'd:\Sem 3\Miniproject\ml\dataset\test'
}
RESULTS_DIR = r'd:\Sem 3\Miniproject\ml\results'

CLASS_MAPPING = {
    'Healthy': 'Healthy',
    'Mosaic': 'Mosaic',
    'RedRot': 'Red Rot',
    'Rust': 'Rust',
    'Yellow': 'Yellow'
}

def file_hash(filepath):
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def prepare_dataset():
    os.makedirs(RESULTS_DIR, exist_ok=True)
    for d in SPLIT_DIRS.values():
        os.makedirs(d, exist_ok=True)

    report = {
        "total_raw_images": 0,
        "valid_images": 0,
        "corrupted_images": 0,
        "duplicate_images": 0,
        "class_counts_raw": {},
        "class_counts_clean": {},
        "split_counts": {"train": {}, "val": {}, "test": {}}
    }

    seen_hashes = {}
    cleaned_items = []

    print("Step 1: Validating and deduplicating images...", flush=True)
    for folder, standard_class in CLASS_MAPPING.items():
        folder_path = os.path.join(RAW_DIR, folder)
        if not os.path.exists(folder_path):
            continue

        raw_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp'))]
        report["class_counts_raw"][standard_class] = len(raw_files)
        report["total_raw_images"] += len(raw_files)

        for filename in raw_files:
            file_path = os.path.join(folder_path, filename)
            
            # Fast PIL open without full pixel decode verify to avoid PIL slow verify overhead
            try:
                with Image.open(file_path) as img:
                    img.load()
                    width, height = img.size
            except Exception as e:
                report["corrupted_images"] += 1
                print(f"Corrupted image skipped: {file_path} ({e})", flush=True)
                continue

            # Deduplication check via MD5 hash
            h = file_hash(file_path)
            if h in seen_hashes:
                report["duplicate_images"] += 1
                continue
            seen_hashes[h] = file_path

            cleaned_items.append({
                "path": file_path,
                "class_name": standard_class,
                "filename": filename,
                "width": width,
                "height": height
            })

    report["valid_images"] = len(cleaned_items)
    print(f"Valid images: {len(cleaned_items)}, duplicates: {report['duplicate_images']}, corrupted: {report['corrupted_images']}", flush=True)

    # Group cleaned items by class
    by_class = {}
    for item in cleaned_items:
        cls = item["class_name"]
        if cls not in by_class:
            by_class[cls] = []
        by_class[cls].append(item)
        report["class_counts_clean"][cls] = report["class_counts_clean"].get(cls, 0) + 1

    print("\nStep 2: Performing Stratified Train (70%) / Validation (15%) / Test (15%) Split...", flush=True)

    np.random.seed(42)  # Deterministic reproducible split

    for cls, items in by_class.items():
        np.random.shuffle(items)
        n = len(items)
        n_train = int(n * 0.70)
        n_val = int(n * 0.15)
        
        train_items = items[:n_train]
        val_items = items[n_train:n_train + n_val]
        test_items = items[n_train + n_val:]

        splits = [('train', train_items), ('val', val_items), ('test', test_items)]

        for split_name, split_list in splits:
            dest_folder = os.path.join(SPLIT_DIRS[split_name], cls)
            os.makedirs(dest_folder, exist_ok=True)
            report["split_counts"][split_name][cls] = len(split_list)

            for item in split_list:
                dest_path = os.path.join(dest_folder, item["filename"])
                shutil.copy2(item["path"], dest_path)

    report_path = os.path.join(RESULTS_DIR, 'dataset_report.json')
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    print("\nDataset Preparation Completed Successfully!", flush=True)
    print(json.dumps(report, indent=2), flush=True)

if __name__ == '__main__':
    prepare_dataset()
